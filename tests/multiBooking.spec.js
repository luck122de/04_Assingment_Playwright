import { test, expect, request } from "@playwright/test";
import { APIutils } from "./utils/APIutils.js";

const loginCredential = {
  email: "raiankit390@gmail.com",
  password: "Shreelu@323",
};
let token;

//function to get details of booking
async function getDetails(page, event, category, city, ticketNumber) {
  let payload = {};
  await page.goto("/events");
  const search = page.locator("[placeholder*=Search]");
  await search.pressSequentially(event, { delay: 150 });
  const categories = page.locator("select");
    await categories.nth(0).selectOption(category);
    await categories.nth(1).selectOption(city);
  

  const card = page.locator("#event-card");
  await card.first().waitFor();
  // await card.locator('//a[@data-testid="book-now-btn"]').click()-- why failing
  await card.first().getByTestId("book-now-btn").click();
  // await page.waitForLoadState('networkidle');
  // await page.locator('main').first().waitFor({state:'visible'});
  //yh fail hoo rha hai kyuki new page render hone se pahle pichle page ka main ko man le rha hai execute hoo raha hai main
  await page.locator("#customerName").waitFor();

  //store title
  const title=await page.locator('h1').filter({hasText:event}).innerText();
  console.log(title);

  const ticketCountLocator = page.locator("#ticket-count");
  let ticketCount = await ticketCountLocator.textContent();

  expect(ticketCountLocator).toHaveText("1");
  const quantityButtons = page.locator("button[type='button']");
  if (ticketNumber > 1) {
    for (let i = ticketNumber; ticketNumber > 1; ticketNumber--) {
      await quantityButtons.filter({ hasText: "+" }).click();
      ticketCount++;
    }
  }
  await page.locator("#customerName").fill("Ankit");
  await page.locator("#customer-email").fill("raiankit390@gmail.com");
  await page.locator("#phone").fill("1234567890");
  // const total = await page.locator("form").locator(".text-indigo-700").nth(2).textContent();
  // console.log(total);
  await page.locator("[type='submit']").click();

  //verifying value and titles
  await page.locator("h3", { hasText: "Booking Confirmed! 🎉" }).waitFor();

  await expect(
    page.locator("h3", { hasText: "Booking Confirmed! 🎉" }),
  ).toBeVisible();

  await expect(page.locator(".booking-ref")).not.toBeEmpty();

  await expect(
    page.locator("//span[text()='Tickets']/following-sibling::span"),
  ).toHaveText(ticketCount.toString());

  // await expect(
  //   page.locator("//span[text()='Total']/following-sibling::span"),
  // ).toHaveText(total);

  //capture values
  payload.bookingRef = await page.locator(".booking-ref").textContent();
  payload.name = await page.locator("//span[text()='Customer']/following-sibling::span").textContent();
  payload.tickets = ticketCount;
  payload.totalPrice = await page.locator("//span[text()='Total']/following-sibling::span").textContent();
  payload.title=title;
  //  const bookingBtn= page.locator("//button[text() = 'View My Bookings']")
  //  await bookingBtn.click();
  return payload;
}

test.beforeAll(async () => {
  const apiContext = await request.newContext();
  const apiUtils = new APIutils(apiContext, loginCredential);
  token = await apiUtils.getToken();
  console.log(token);
});
test("multi booking history and detail reconciliation", async ({ page }) => {
  await page.addInitScript((value) => {
    window.localStorage.setItem("eventhub_token", value);
  }, token);
  const booking1=await getDetails(page, "world", "Conference", "Hyderabad", 1);
  const booking2=await getDetails(page, "Dilli","Festival","Delhi",2);
  console.log(booking1);
  console.log(booking2);


  //booking refrence is unique
  expect(booking1.bookingRef).not.toBe(booking2.bookingRef);

  //store ticket for 2nd
  expect(booking2.tickets.toString()).toBe('2');
  
  await page.goto('/bookings');
 await page.locator("//h1[text()='My Bookings']").waitFor();
 const refIDLocator1=page.locator("//div[@id='booking-card']").filter({'hasText':booking1.bookingRef});
 const refIDLocator2=page.locator("//div[@id='booking-card']").filter({'hasText':booking2.bookingRef});

 //verify visibility of both card
 await expect(refIDLocator1).toBeVisible();
 await expect(refIDLocator2).toBeVisible();

 //verifying "confirmed status"
 await expect(refIDLocator1.locator("//span[text()='confirmed']")).toBeVisible();
 await expect(refIDLocator2.locator("//span[text()='confirmed']")).toBeVisible();

//Title verification
await expect(refIDLocator1.locator("h3").filter({hasText:booking1.title})).toBeVisible();
await expect(refIDLocator2.locator("h3").filter({hasText:booking2.title})).toBeVisible()

 //verifying compair with payload refIDLocator1
 await expect(refIDLocator1.locator("p").nth(0)).toHaveText(booking1.totalPrice);
const ticketRef1=await refIDLocator1.locator("//span[text()=' ticket']").textContent();
const ticketRef1Split=ticketRef1.split(" ");
expect(ticketRef1Split[1]).toBe(booking1.tickets.toString());


await expect(refIDLocator2.locator("p").nth(0)).toHaveText(booking2.totalPrice);
const ticketRef2=await refIDLocator2.locator("//span[text()=' ticket']").textContent();
const ticketRef2Split=ticketRef2.split(" ");
expect(ticketRef2Split[1]).toBe(booking2.tickets.toString());


const button1=refIDLocator1.locator("//a//button[normalize-space()='View Details']");
const button2=refIDLocator2.locator("//a//button[normalize-space()='View Details']");


//open view Details page
await button1.click();

await page.locator("//button[text()='← Back to My Bookings']").waitFor();

//Booking Reference.
const bookingReference=page.locator("//span[normalize-space()='confirmed']//preceding-sibling::span");
await expect(bookingReference).toHaveText(booking1.bookingRef)

// Main event title matches Booking 1.
await expect(page.locator("h1").filter({hasText:booking1.title})).toBeVisible();

// Customer email address matches the logged-in user profile.
await expect(page.locator("//span[normalize-space()='Email']/following-sibling::span")).toHaveText((loginCredential.email));

// Payment summary fields (tickets and total amount) match Booking 1.
await expect(page.locator("//span[text()='Tickets']/following-sibling::span")).toHaveText(booking1.tickets);
   
await expect(page.locator("//span[text()='Total Paid']/following-sibling::span")).toHaveText(booking1.totalPrice);

  

// Booking ID is present, non-empty, and strictly numeric.
const bookingLocator= page.locator("//span[text()='Booking ID']/following-sibling::span")
await expect(bookingLocator).toBeVisible();

const bookingText=await bookingLocator.innerText();
const bookingTextSplit= bookingText.split(" ")
const bookingID=bookingTextSplit[1];

expect(bookingID).not.toBeNaN();

});



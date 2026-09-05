import { test, expect, request } from "@playwright/test";
import { APIutils } from "./utils/APIutils.js";
const {createBooking} = require("./utils/fixtures.js");

const loginCredential = {
  email: "raiankit390@gmail.com",
  password: "Shreelu@323",
};

createBooking("multi booking history and detail reconciliation", async ({authenticate,getDetails,page }) => {

 
  await authenticate.goto("/bookings");
  await authenticate.pause();

    const booking1=await getDetails(authenticate, "world", "Conference", "Hyderabad", 1);
    const booking2=await getDetails(authenticate, "Dilli","Festival","Delhi",2);
     console.log(booking1);
     console.log(booking2);

       //booking refrence is unique
  expect(booking1.bookingRef).not.toBe(booking2.bookingRef);

  //store ticket for 2nd
  expect(booking2.tickets.toString()).toBe('2');
  
 await authenticate.goto('/bookings');
 await authenticate.locator("//h1[text()='My Bookings']").waitFor();
 const refIDLocator1=authenticate.locator("//div[@id='booking-card']").filter({'hasText':booking1.bookingRef});
 const refIDLocator2=authenticate.locator("//div[@id='booking-card']").filter({'hasText':booking2.bookingRef});

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


//open view Details authenticate
await button1.click();

await authenticate.locator("//button[text()='← Back to My Bookings']").waitFor();

//Booking Reference.
const bookingReference=authenticate.locator("//span[normalize-space()='confirmed']//preceding-sibling::span");
await expect(bookingReference).toHaveText(booking1.bookingRef)

// Main event title matches Booking 1.
await expect(authenticate.locator("h1").filter({hasText:booking1.title})).toBeVisible();

// Customer email address matches the logged-in user profile.
await expect(authenticate.locator("//span[normalize-space()='Email']/following-sibling::span")).toHaveText((loginCredential.email));

// Payment summary fields (tickets and total amount) match Booking 1.
await expect(authenticate.locator("//span[text()='Tickets']/following-sibling::span")).toHaveText(booking1.tickets);
   
await expect(authenticate.locator("//span[text()='Total Paid']/following-sibling::span")).toHaveText(booking1.totalPrice);

  

// Booking ID is present, non-empty, and strictly numeric.
const bookingLocator= authenticate.locator("//span[text()='Booking ID']/following-sibling::span")
await expect(bookingLocator).toBeVisible();

const bookingText=await bookingLocator.innerText();
const bookingTextSplit= bookingText.split(" ")
const bookingID=bookingTextSplit[1];

expect(bookingID).not.toBeNaN();
})


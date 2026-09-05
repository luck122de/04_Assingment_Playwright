const base=require('@playwright/test');
import { APIutils } from "./APIutils.js";
import {request,test,expect} from "@playwright/test";

const loginCredential = {
  email: "raiankit390@gmail.com",
  password: "Shreelu@323",
};

exports.createBooking=base.test.extend({

    // STEP 1: Pehle ye fixture chalega (API se token leke localStorage me inject karega)
  authenticate: async ({ page }, use) => {
    const apiContext = await request.newContext();
    const apiUtils = new APIutils(apiContext, loginCredential);
    const token = await apiUtils.getToken();

    // Browser ke open hone se pehle hi token localStorage me store ho jayega
    await page.addInitScript((value) => {
      window.localStorage.setItem("eventhub_token", value);
    }, token);

    // Page ready hai token ke sath
    await use(page);

    // Cleanup
    await apiContext.dispose();
  },

getDetails:async({page,authenticate},use)=>{
    async function getDetail(page,event, category, city, ticketNumber) {
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
    
      await expect(ticketCountLocator).toHaveText("1");
      const quantityButtons = page.locator("button[type='button']");
      if (ticketNumber > 1) {
        for (let i = ticketNumber; i > 1; i--) {
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
     await use(getDetail);
    }

})
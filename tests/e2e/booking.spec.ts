import { expect, test } from "@playwright/test";

test("bilingual booking survives reload and cancellation without duplicate appointments", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en");
  await expect(page.locator(".service-card")).toHaveCount(3);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: test.info().outputPath("linde-desktop.png") });
  await page.goto("/en/book?service=immigration");
  await page
    .getByRole("button", { name: "Explore the sample account" })
    .click();
  await expect(page).toHaveURL(/\/en\/book/);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator(".slot-button").first().click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("textbox", { name: /Anything you would like/ })
    .fill("Synthetic test note. No real case data.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Reserve this time" }).click();
  await expect(page).toHaveURL(/\/en\/booking\/.+\/payment/);
  const bookingUrl = page.url();
  await page.reload();
  await expect(
    page.getByText("Awaiting payment", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: /Anything you would like/ }),
  ).toHaveValue("Synthetic test note. No real case data.");
  await page.getByRole("link", { name: "Cambiar a español" }).click();
  await expect(page).toHaveURL(/\/es\/citas\/.+\/pago/);
  await page.getByRole("link", { name: "Switch to English" }).click();
  await expect(page).toHaveURL(bookingUrl);
  await page
    .getByRole("button", { name: "Simulate successful payment" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your time is reserved." }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("Confirmed", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Cancel appointment", exact: true })
    .click();
  await page.getByRole("button", { name: "Keep appointment" }).click();
  await expect(page.getByText("Confirmed", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Cancel appointment", exact: true })
    .click();
  await page.getByRole("button", { name: "Yes, cancel appointment" }).click();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
  await page.goto("/en/appointments");
  await page
    .getByRole("button", { name: "All appointments", exact: true })
    .click();
  await expect(page.locator(".appointment-card")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("mobile navigation, language and layout work without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/es");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Tu siguiente paso.",
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: test.info().outputPath("linde-mobile.png") });
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page
    .locator("#mobile-nav")
    .getByRole("link", { name: "Especialidades" })
    .click();
  await expect(page).toHaveURL(/\/es\/servicios$/);
  await expect(page.locator(".service-card")).toHaveCount(4);
  await page.getByRole("link", { name: "Switch to English" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Start with what matters to you.",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto("/en/does-not-exist");
  await expect(
    page.getByRole("heading", { name: "We could not find that page." }),
  ).toBeVisible();
});

test("auth validation, recovery and protected deep links", async ({ page }) => {
  await page.goto("/en/booking/not-owned");
  await expect(page).toHaveURL(/\/en\/login\?returnTo=/);
  await page.getByRole("link", { name: "Forgot your password?" }).click();
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("synthetic@example.test");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(
    page.getByText(
      "If an account exists, instructions will arrive in your inbox.",
    ),
  ).toBeVisible();
  await page.goto("/en/reset-password");
  await expect(
    page.getByRole("button", { name: "Save new password" }),
  ).toBeDisabled();
  await page.goto("/en/terms");
  await expect(page.getByText(/Preview notice:/)).toBeVisible();
});

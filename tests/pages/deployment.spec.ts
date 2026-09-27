import { expect, test } from "@playwright/test";

test("Pages assets, language switching and reloadable routes", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  const failedAssets: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      /\/(assets|brand)\//.test(new URL(response.url()).pathname)
    )
      failedAssets.push(response.url());
  });
  await page.goto(baseURL + "#/en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your next step.",
  );
  await expect(page.getByText("Explore the sample account")).toHaveCount(0);
  await expect(page.locator(".demo-banner")).toHaveCount(0);
  await page.getByRole("link", { name: "Skip to content" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  await expect(page).toHaveURL(/#\/en$/);
  await page.getByRole("link", { name: "Our approach", exact: true }).click();
  await expect(page).toHaveURL(/#\/en#approach$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your next step.",
  );
  await page.getByRole("link", { name: "Linde — Home" }).first().click();
  const hero = page.locator('img[src*="pathway.svg"]');
  await expect(hero).toBeVisible();
  expect(
    await hero.evaluate(
      (element: HTMLImageElement) =>
        element.complete && element.naturalWidth > 0,
    ),
  ).toBe(true);
  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  const response = await page.request.get(
    new URL(manifestHref!, page.url()).href,
  );
  expect(response.status()).toBe(200);
  const manifest = await response.json();
  const icon = await page.request.get(
    new URL(manifest.icons[1].src, response.url()).href,
  );
  expect(icon.status()).toBe(200);
  await page.getByRole("link", { name: "Cambiar a español" }).click();
  await expect(page).toHaveURL(/#\/es$/);
  await page.getByRole("link", { name: "Ingresar", exact: true }).click();
  await expect(page).toHaveURL(/#\/es\/ingresar$/);
  await page.reload();
  await expect(page.getByRole("textbox", { name: /correo/i })).toBeVisible();
  await page.goto(baseURL + "#/en/services");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Start with what matters to you.",
  );
  expect(errors).toEqual([]);
  expect(failedAssets).toEqual([]);
  await page.goto(baseURL + "#/en");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: test.info().outputPath("pages-desktop.png") });
});

test("Pages mobile navigation stays inside the repository site", async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL + "#/es");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page
    .locator("#mobile-nav")
    .getByRole("link", { name: "Especialidades" })
    .click();
  await expect(page).toHaveURL(/#\/es\/servicios$/);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

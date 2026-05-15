import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(2000);
  
  // Create a textbox
  await page.evaluate(() => {
    window.useStore.getState().setActiveLanguage('hi');
    const canvas = window.useStore.getState().canvas;
    const IText = window.fabric.Textbox;
    const text = new IText('', { left: 100, top: 100, width: 200 });
    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
  });
  
  await page.keyboard.type('namaste ');
  await page.waitForTimeout(1000);
  
  const text = await page.evaluate(() => {
    return window.useStore.getState().canvas.getActiveObject().text;
  });
  
  console.log('Result text:', text);
  await browser.close();
})();

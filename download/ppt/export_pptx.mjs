import { chromium } from 'playwright';
import PptxGenJS from 'pptxgenjs';

const htmlPath = '/home/z/my-project/download/ppt/index.html';
const outputPath = '/home/z/my-project/download/PZC_Group_FX_Risk_Modelling.pptx';
const totalSlides = 10;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

// Navigate to the HTML file
await page.goto(`file://${htmlPath}`);
// Wait for fonts and WebGL to load
await page.waitForTimeout(5000);

const pptx = new PptxGenJS();
pptx.defineLayout({ name: 'CUSTOM', width: 13.33, height: 7.5 }); // 16:9
pptx.layout = 'CUSTOM';

for (let i = 0; i < totalSlides; i++) {
  // Navigate to slide i
  await page.evaluate((idx) => {
    const slides = document.querySelectorAll('.slide');
    const deck = document.getElementById('deck');
    deck.style.transform = `translateX(${-idx * 100}vw)`;
    slides.forEach((s, j) => s.classList.toggle('active', j === idx));
    document.body.classList.toggle('light-bg', slides[idx].classList.contains('light'));
  }, i);

  await page.waitForTimeout(1500); // Wait for transition

  // Screenshot the entire slide
  const slideEl = await page.$(`.slide:nth-child(${i + 1})`);
  const buffer = await slideEl.screenshot({ type: 'png' });

  // Add slide to PPTX
  const slide = pptx.addSlide();
  slide.addImage({
    data: `image/png;base64,${buffer.toString('base64')}`,
    x: 0,
    y: 0,
    w: 13.33,
    h: 7.5,
  });

  console.log(`Slide ${i + 1} exported`);
}

await pptx.writeFile({ fileName: outputPath });
console.log(`PPTX saved to ${outputPath}`);
await browser.close();

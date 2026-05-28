const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function main() {
  const assetsDir = path.join(__dirname, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
  }

  const srcIconPath = path.join(__dirname, 'src', 'assets', 'icon', 'gadget.png');
  console.log('Reading source icon from:', srcIconPath);
  
  if (!fs.existsSync(srcIconPath)) {
    console.error('Source icon does not exist at:', srcIconPath);
    process.exit(1);
  }

  const srcIcon = await Jimp.read(srcIconPath);

  // 1. Generate icon.png (1024x1024)
  // Background color matching card/surface: #17171c
  console.log('Generating icon.png...');
  const iconBg = new Jimp({
    width: 1024,
    height: 1024,
    color: '#17171cFF'
  });
  
  // Resize srcIcon to be about 60% of 1024 (e.g. 600x600)
  const resizedSrcIconForIcon = srcIcon.clone();
  resizedSrcIconForIcon.resize({ w: 600, h: 600 });
  
  const iconX = Math.floor((1024 - resizedSrcIconForIcon.width) / 2);
  const iconY = Math.floor((1024 - resizedSrcIconForIcon.height) / 2);
  
  iconBg.composite(resizedSrcIconForIcon, iconX, iconY);
  await iconBg.write(path.join(assetsDir, 'icon.png'));
  console.log('icon.png generated successfully!');

  // 2. Generate splash.png and splash-dark.png (2732x2732)
  // Background color matching app background: #0e0e11
  console.log('Generating splash.png and splash-dark.png...');
  const splashBg = new Jimp({
    width: 2732,
    height: 2732,
    color: '#0e0e11FF'
  });
  
  // Resize srcIcon to be about 25% of 2732 (e.g. 680x680)
  const resizedSrcIconForSplash = srcIcon.clone();
  resizedSrcIconForSplash.resize({ w: 680, h: 680 });
  
  const splashX = Math.floor((2732 - resizedSrcIconForSplash.width) / 2);
  const splashY = Math.floor((2732 - resizedSrcIconForSplash.height) / 2);
  
  splashBg.composite(resizedSrcIconForSplash, splashX, splashY);
  await splashBg.write(path.join(assetsDir, 'splash.png'));
  await splashBg.write(path.join(assetsDir, 'splash-dark.png'));
  console.log('splash.png and splash-dark.png generated successfully!');
  
  console.log('All high-resolution base assets generated in /assets folder!');
}

main().catch(console.error);

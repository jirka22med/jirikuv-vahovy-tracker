 
// ⚙️ Favicon loader – více admirála Jiříka

function setFavicon(url, type = "image/png", size = "32x32") {
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = type;
  link.sizes = size;
  link.href = url;

  // Odstranit staré favicony, aby se nepřekrývaly
  const existingIcons = document.querySelectorAll('link[rel="icon"]');
  existingIcons.forEach(el => el.remove());

  document.head.appendChild(link);
}

// 🧠 Dynamika podle zařízení
if (window.innerWidth < 768) {
  // Mobil
  setFavicon("https://img41.rajce.idnes.cz/d4102/19/19244/19244630_db82ad174937335b1a151341387b7af2/images/image_512x512.jpg?ver=0");
} else {
  // Desktop
  setFavicon("https://img41.rajce.idnes.cz/d4102/19/19244/19244630_db82ad174937335b1a151341387b7af2/images/image_192x192.jpg?ver=0");
}

// 💡 BONUS: Favicon podle denní doby
 
const hour = new Date().getHours();
if (hour >= 20 || hour < 6) {
  setFavicon("https://img40.rajce.idnes.cz/d4003/19/19517/19517492_984d6887838eae80a8eb677199393188/images/ChatGPTImage7.7.202510_11_04.jpg?ver=0");
}
 

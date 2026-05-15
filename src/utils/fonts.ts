export const INDIC_FONTS = [
  { name: 'Noto Sans Devanagari', display: 'Noto Sans Devanagari' },
  { name: 'Noto Sans Telugu', display: 'Noto Sans Telugu' },
  { name: 'Noto Sans Tamil', display: 'Noto Sans Tamil' },
  { name: 'Noto Sans Gujarati', display: 'Noto Sans Gujarati' },
  { name: 'Noto Sans Bengali', display: 'Noto Sans Bengali' },
  { name: 'Noto Sans Gurmukhi', display: 'Noto Sans Gurmukhi' },
  { name: 'Noto Sans Kannada', display: 'Noto Sans Kannada' },
  { name: 'Noto Sans Malayalam', display: 'Noto Sans Malayalam' },
  { name: 'Noto Sans Oriya', display: 'Noto Sans Oriya' },
  { name: 'Noto Sans Arabic', display: 'Noto Sans Arabic' },
  { name: 'Noto Nastaliq Urdu', display: 'Noto Nastaliq Urdu' }
];

export const GOOGLE_FONTS = [
  // Sans-serif
  'Inter', 'Outfit', 'Roboto', 'Open Sans', 'Montserrat', 'Lato', 'Poppins', 'Raleway', 'Ubuntu', 'PT Sans', 
  'Source Sans Pro', 'Kanit', 'Heebo', 'Work Sans', 'DM Sans', 'Quicksand', 'Josefin Sans', 'Nunito', 'Fira Sans', 
  'Noto Sans', 'Rubik', 'Arimo', 'Mulish', 'Karla', 'IBM Plex Sans', 'Manrope', 'Comfortaa', 'Questrial', 'Antic Sans', 
  'Hind', 'Cabin', 'Varela Round', 'Libre Franklin', 'Maven Pro', 'Bitter', 'Public Sans', 'Space Grotesk', 'Syne', 

  // Serif
  'Playfair Display', 'Merriweather', 'PT Serif', 'Source Serif Pro', 'Lora', 'Arvo', 'Crimson Text', 'Libre Baskerville', 
  'EB Garamond', 'Cormorant Garamond', 'Old Standard TT', 'Zilla Slab', 'Spectral', 'Domine', 'Vollkorn', 'Cardo', 
  'Josefin Slab', 'Alice', 'Cinzel', 'Bree Serif', 'Abril Fatface', 'Noticia Text', 'Tinos', 'Rokkitt', 'Faustina', 

  // Display / Decorative
  'Oswald', 'Anton', 'Fjalla One', 'Pacifico', 'Lobster', 'Righteous', 'Fredoka One', 'Bangers', 'Bebas Neue', 
  'Alfa Slab One', 'Permanent Marker', 'Luckiest Guy', 'Passion One', 'Patua One', 'Cinzel Decorative', 'Spicy Rice', 
  'Unbounded', 'Climate Crisis', 'Nabla', 'Modak', 'Alumni Sans Pinstripe', 

  // Handwriting
  'Dancing Script', 'Caveat', 'Shadows Into Light', 'Indie Flower', 'Amatic SC', 'Sacramento', 'Satisfy', 'Cookie', 
  'Great Vibes', 'Alex Brush', 'Allura', 'Courgette', 'Parisienne', 'Marck Script', 'Kaushan Script', 'Tangerine', 
  'Yellowtail', 'Grand Hotel', 'Rochester', 'Berkshire Swash', 'Gloria Hallelujah', 'Patrick Hand', 'Rock Salt', 
  'Architects Daughter', 'Kalam', 'Handlee', 'Covered By Your Grace', 'Coming Soon', 'Homemade Apple', 'Reenie Beanie'
];



export const ALL_FONTS = [
  ...GOOGLE_FONTS.map(f => ({ name: f, display: f })),
  ...INDIC_FONTS
].sort((a, b) => a.display.localeCompare(b.display));

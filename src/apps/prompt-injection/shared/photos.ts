// Photos of the shop's items, in public/prompt-injection/<item id>.jpg.
// All from Wikimedia Commons under free licences that ask for credit; the
// shop's "About" page lists them. The photos were scaled down to 640 px.

export type Photo = { author: string; licence: string; /** The photo's page on Wikimedia Commons. */ page: string };

export const PHOTOS: Record<string, Photo> = {
  "olympus-trip": { author: "Michael Gatchell", licence: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Olympus_Trip_35_camera.jpg" },
  "rennvelo": { author: "Sludge G", licence: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:Retro_cycle_shop,_Berlin_Friedrichshain_(9689970882).jpg" },
  "ski": { author: "Викидим", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Rossignol_Experience_88_Ti_Skis.jpg" },
  "sessel": { author: "Didouner", licence: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Club_chair_2.jpg" },
  "lampe": { author: "Christos Vittoratos", licence: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Christian-dell_molitor-office-work-lamp-light.jpg" },
  "plattenspieler": { author: "Jrs9550", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Unitra-Fonica_WG-511_Turntable_Record_Player.jpg" },
  "gitarre": { author: "Trude Bergheim Mikkelsen", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Steel-string-acoustic-guitar.JPG" },
  "espresso": { author: "massage-techniques", licence: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:Pulling_a_triple_espresso_shot_with_a_naked_portafilter,_view_from_the_bottom.jpg" },
  "rucksack": { author: "de:Benutzer:sjr", licence: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Rucksack1.jpg" },
  "schreibmaschine": { author: "Typophile~commonswiki", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Hermes_Baby_Greek_kbd_1958.jpg" },
  "radio": { author: "Eszcze", licence: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Goplana_radio.JPG" },
  "fernglas": { author: "Francis Flinch", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Optolyth_Alpin_7%C3%9742_binoculars.jpg" },
  jumbo: { author: "Gibb Stutz", licence: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:Gibson_SJ200.jpg" },
  "canon-ae1": { author: "RRT877", licence: "CC0", page: "https://commons.wikimedia.org/wiki/File:Wikicommons_canon_ae-1_rrt877.jpg" },
  "arosa-35": { author: "Sarah sofía", licence: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Argus_21_rangefinder_camera_(brighter_version).JPG" },
  "my-listing": { author: "Runner1616", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Drug_3925.jpg" },
};

export const photoUrl = (id: string) => (PHOTOS[id] ? `/prompt-injection/${id}.jpg` : undefined);

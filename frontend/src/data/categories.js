// Categorías y personajes para modo offline/local
// Basado en backend/seeds/categories_seed.sql

// Avatares para modo local
export const LOCAL_AVATARS = [
  '🦊', '🐼', '🦁', '🐯', '🐻',
  '🐨', '🐸', '🦉', '🦄', '🐲',
  '🐺', '🐰', '🐨', '🐷', '🐶'
];

// Categorías offline con sus personajes
const OFFLINE_CATEGORIES_DATA = [
  {
    id: 1,
    name: 'Harry Potter',
    description: 'Personajes del mundo mágico de Harry Potter',
    icon: '⚡',
    characters: [
      'Harry Potter', 'Hermione Granger', 'Ron Weasley', 'Albus Dumbledore',
      'Lord Voldemort', 'Severus Snape', 'Draco Malfoy', 'Rubeus Hagrid',
      'Sirius Black', 'Dobby', 'Bellatrix Lestrange', 'Neville Longbottom',
      'Luna Lovegood', 'Ginny Weasley', 'Fred Weasley', 'George Weasley',
      'Minerva McGonagall', 'Remus Lupin', 'Alastor Moody', 'Nymphadora Tonks',
      'Cedric Diggory', 'Cho Chang', 'Lucius Malfoy', 'Molly Weasley',
      'Arthur Weasley', 'Dolores Umbridge', 'Gilderoy Lockhart', 'Horace Slughorn',
      'Newt Scamander', 'Gellert Grindelwald'
    ]
  },
  {
    id: 2,
    name: 'Disney Clásico',
    description: 'Personajes clásicos de películas Disney',
    icon: '🏰',
    characters: [
      'Mickey Mouse', 'Minnie Mouse', 'Donald Duck', 'Goofy', 'Pluto',
      'Blancanieves', 'Cenicienta', 'Aurora (Bella Durmiente)', 'Ariel',
      'Bella', 'Bestia', 'Jasmine', 'Aladdín', 'Genio', 'Mulán', 'Pocahontas',
      'Rapunzel', 'Flynn Rider', 'Elsa', 'Anna', 'Olaf', 'Moana', 'Maui',
      'Simba', 'Mufasa', 'Scar', 'Timón', 'Pumba', 'Stitch', 'Maléfica'
    ]
  },
  {
    id: 3,
    name: 'Disney Pixar',
    description: 'Personajes de películas Pixar',
    icon: '🎬',
    characters: [
      'Woody', 'Buzz Lightyear', 'Jessie', 'Rex', 'Mr. Potato',
      'Nemo', 'Dory', 'Marlin', 'Bob Parr (Mr. Increíble)', 'Elastigirl',
      'Violeta Parr', 'Dash Parr', 'Jack-Jack', 'Edna Moda', 'Mike Wazowski',
      'Sulley', 'Boo', 'Rayo McQueen', 'Mate', 'WALL-E', 'EVA',
      'Carl Fredricksen', 'Russell', 'Dug', 'Remy', 'Alfredo Linguini',
      'Joy (Alegría)', 'Sadness (Tristeza)', 'Miguel Rivera', 'Héctor'
    ]
  },
  {
    id: 4,
    name: 'Marvel',
    description: 'Superhéroes y villanos del universo Marvel',
    icon: '🦸',
    characters: [
      'Iron Man', 'Capitán América', 'Thor', 'Hulk', 'Black Widow',
      'Hawkeye', 'Spider-Man', 'Doctor Strange', 'Black Panther', 'Scarlet Witch',
      'Vision', 'Ant-Man', 'Wasp', 'Captain Marvel', 'Star-Lord',
      'Gamora', 'Drax', 'Rocket Raccoon', 'Groot', 'Nebula', 'Thanos',
      'Loki', 'Nick Fury', 'Bucky Barnes', 'Falcon', 'War Machine',
      'Shang-Chi', 'Deadpool', 'Wolverine', 'Professor X'
    ]
  },
  {
    id: 5,
    name: 'DC Comics',
    description: 'Superhéroes y villanos de DC',
    icon: '🦇',
    characters: [
      'Batman', 'Superman', 'Wonder Woman', 'Aquaman', 'The Flash',
      'Cyborg', 'Green Lantern', 'Shazam', 'Joker', 'Harley Quinn',
      'Catwoman', 'Poison Ivy', 'Bane', 'Riddler', 'Penguin',
      'Two-Face', 'Alfred Pennyworth', 'Robin', 'Batgirl', 'Nightwing',
      'Lex Luthor', 'Darkseid', 'Doomsday', 'General Zod', 'Black Adam',
      'Supergirl', 'Martian Manhunter', 'Green Arrow', 'Black Canary', 'Constantine'
    ]
  },
  {
    id: 6,
    name: 'Anime Shonen',
    description: 'Personajes de anime shonen popular',
    icon: '⚔️',
    characters: [
      'Goku', 'Vegeta', 'Gohan', 'Piccolo', 'Frieza',
      'Naruto Uzumaki', 'Sasuke Uchiha', 'Sakura Haruno', 'Kakashi Hatake', 'Itachi Uchiha',
      'Monkey D. Luffy', 'Roronoa Zoro', 'Sanji', 'Nami', 'Ichigo Kurosaki',
      'Rukia Kuchiki', 'Eren Jaeger', 'Mikasa Ackerman', 'Levi Ackerman',
      'Tanjiro Kamado', 'Nezuko Kamado', 'Zenitsu Agatsuma', 'Izuku Midoriya (Deku)',
      'All Might', 'Bakugo Katsuki', 'Gon Freecss', 'Killua Zoldyck',
      'Saitama', 'Genos', 'Asta'
    ]
  },
  {
    id: 7,
    name: 'Anime Clásico',
    description: 'Personajes de anime clásico',
    icon: '🎌',
    characters: [
      'Sailor Moon', 'Tuxedo Mask', 'Sakura Kinomoto', 'Inuyasha', 'Kagome Higurashi',
      'Edward Elric', 'Alphonse Elric', 'Light Yagami', 'L', 'Ryuk',
      'Spike Spiegel', 'Faye Valentine', 'Vash the Stampede', 'Kenshin Himura',
      'Alucard', 'Yusuke Urameshi', 'Kurama', 'Hiei', 'Guts', 'Griffith',
      'Lelouch Lamperouge', 'C.C.', 'Shinji Ikari', 'Asuka Langley', 'Rei Ayanami',
      'Motoko Kusanagi', 'Astro Boy', 'Doraemon', 'Shin Chan', 'Detective Conan'
    ]
  },
  {
    id: 8,
    name: 'Studio Ghibli',
    description: 'Personajes de películas de Ghibli',
    icon: '🌿',
    characters: [
      'Totoro', 'Chihiro', 'Haku', 'Sin Cara (No-Face)', 'Yubaba',
      'Sophie', 'Howl', 'Calcifer', 'San (Princesa Mononoke)', 'Ashitaka',
      'Kiki', 'Jiji', 'Ponyo', 'Sosuke', 'Sheeta', 'Pazu',
      'Nausicaä', 'Porco Rosso', 'Arrietty', 'Satsuki', 'Mei',
      'Catbus', 'Barón', 'Muta'
    ]
  },
  {
    id: 9,
    name: 'Juego de Tronos',
    description: 'Personajes de Game of Thrones',
    icon: '🐉',
    characters: [
      'Jon Snow', 'Daenerys Targaryen', 'Tyrion Lannister', 'Cersei Lannister', 'Jaime Lannister',
      'Arya Stark', 'Sansa Stark', 'Bran Stark', 'Ned Stark', 'Catelyn Stark',
      'Robb Stark', 'The Hound (Sandor Clegane)', 'The Mountain (Gregor Clegane)', 'Joffrey Baratheon',
      'Robert Baratheon', 'Stannis Baratheon', 'Melisandre', 'Davos Seaworth', 'Varys',
      'Petyr Baelish (Littlefinger)', 'Brienne of Tarth', 'Samwell Tarly', 'Jorah Mormont',
      'Grey Worm', 'Missandei', 'Theon Greyjoy', 'Ramsay Bolton', 'Night King', 'Hodor', 'Oberyn Martell'
    ]
  },
  {
    id: 10,
    name: 'Breaking Bad',
    description: 'Personajes de Breaking Bad y Better Call Saul',
    icon: '🧪',
    characters: [
      'Walter White', 'Jesse Pinkman', 'Skyler White', 'Hank Schrader', 'Marie Schrader',
      'Walter White Jr.', 'Saul Goodman', 'Gus Fring', 'Mike Ehrmantraut', 'Tuco Salamanca',
      'Héctor Salamanca', 'Los Primos (Salamanca Twins)', 'Todd Alquist', 'Lydia Rodarte-Quayle',
      'Jane Margolis', 'Andrea Cantillo', 'Badger', 'Skinny Pete', 'Kim Wexler',
      'Chuck McGill', 'Howard Hamlin', 'Nacho Varga', 'Lalo Salamanca'
    ]
  },
  {
    id: 11,
    name: 'The Office',
    description: 'Personajes de The Office US',
    icon: '📎',
    characters: [
      'Michael Scott', 'Dwight Schrute', 'Jim Halpert', 'Pam Beesly', 'Andy Bernard',
      'Kevin Malone', 'Angela Martin', 'Oscar Martinez', 'Stanley Hudson', 'Phyllis Vance',
      'Meredith Palmer', 'Creed Bratton', 'Ryan Howard', 'Kelly Kapoor', 'Toby Flenderson',
      'Darryl Philbin', 'Erin Hannon', 'Gabe Lewis', 'Jan Levinson', 'Holly Flax',
      'Robert California', 'Nellie Bertram', 'Pete Miller', 'Clark Green'
    ]
  },
  {
    id: 12,
    name: 'Friends',
    description: 'Personajes de la serie Friends',
    icon: '☕',
    characters: [
      'Rachel Green', 'Monica Geller', 'Phoebe Buffay', 'Joey Tribbiani', 'Chandler Bing',
      'Ross Geller', 'Gunther', 'Janice Litman', 'Richard Burke', 'Mike Hannigan',
      'Emily Waltham', 'Carol Willick', 'Susan Bunch', 'Ben Geller', 'Emma Geller-Green',
      'Jack Geller', 'Judy Geller', 'Ursula Buffay', 'Frank Buffay Jr.', 'Estelle Leonard'
    ]
  },
  {
    id: 13,
    name: 'Stranger Things',
    description: 'Personajes de Stranger Things',
    icon: '🔦',
    characters: [
      'Eleven', 'Mike Wheeler', 'Dustin Henderson', 'Lucas Sinclair', 'Will Byers',
      'Max Mayfield', 'Steve Harrington', 'Nancy Wheeler', 'Jonathan Byers', 'Joyce Byers',
      'Jim Hopper', 'Eddie Munson', 'Robin Buckley', 'Erica Sinclair', 'Murray Bauman',
      'Billy Hargrove', 'Karen Wheeler', 'Dr. Martin Brenner', 'Demogorgon', 'Mind Flayer',
      'Vecna', 'Argyle', 'Suzie Bingham'
    ]
  },
  {
    id: 14,
    name: 'La Casa de Papel',
    description: 'Personajes de La Casa de Papel',
    icon: '💰',
    characters: [
      'El Profesor', 'Tokio', 'Berlín', 'Nairobi', 'Denver',
      'Río', 'Helsinki', 'Oslo', 'Moscú', 'Estocolmo (Mónica)',
      'Lisboa (Raquel)', 'Palermo', 'Bogotá', 'Marsella', 'Manila',
      'Alicia Sierra', 'Arturo Román', 'Ángel Rubio', 'Coronel Tamayo', 'Gandía'
    ]
  },
  {
    id: 15,
    name: 'Los Simpson',
    description: 'Personajes de Los Simpson',
    icon: '🍩',
    characters: [
      'Homer Simpson', 'Marge Simpson', 'Bart Simpson', 'Lisa Simpson', 'Maggie Simpson',
      'Abuelo Simpson', 'Ned Flanders', 'Mr. Burns', 'Smithers', 'Moe Szyslak',
      'Barney Gumble', 'Krusty el Payaso', 'Milhouse Van Houten', 'Nelson Muntz', 'Ralph Wiggum',
      'Jefe Wiggum', 'Apu Nahasapeemapetilon', 'Dr. Hibbert', 'Dr. Nick', 'Otto Mann',
      'Seymour Skinner', 'Edna Krabappel', 'Groundskeeper Willie', 'Sideshow Bob', 'Comic Book Guy',
      'Patty Bouvier', 'Selma Bouvier', 'Troy McClure', 'Lionel Hutz', 'Itchy y Scratchy'
    ]
  },
  {
    id: 16,
    name: 'Bob Esponja',
    description: 'Personajes de Bob Esponja',
    icon: '🧽',
    characters: [
      'Bob Esponja', 'Patricio Estrella', 'Calamardo Tentáculos', 'Don Cangrejo', 'Arenita Mejillas',
      'Plankton', 'Karen', 'Gary', 'Señora Puff', 'Larry la Langosta',
      'Perla Cangrejo', 'Sirena Man', 'Chico Percebe', 'El Holandés Volador', 'Hombre Ray',
      'Dennis', 'Rey Neptuno', 'Triton'
    ]
  },
  {
    id: 17,
    name: 'Star Wars',
    description: 'Personajes del universo Star Wars',
    icon: '⭐',
    characters: [
      'Luke Skywalker', 'Darth Vader', 'Princesa Leia', 'Han Solo', 'Chewbacca',
      'Obi-Wan Kenobi', 'Yoda', 'Emperador Palpatine', 'R2-D2', 'C-3PO',
      'Anakin Skywalker', 'Padmé Amidala', 'Mace Windu', 'Qui-Gon Jinn', 'Darth Maul',
      'Count Dooku', 'General Grievous', 'Kylo Ren', 'Rey', 'Finn',
      'Poe Dameron', 'BB-8', 'The Mandalorian', 'Baby Yoda (Grogu)', 'Boba Fett',
      'Jabba the Hutt', 'Lando Calrissian', 'Ahsoka Tano', 'Captain Rex', 'Grand Admiral Thrawn'
    ]
  },
  {
    id: 18,
    name: 'El Señor de los Anillos',
    description: 'Personajes de LOTR y El Hobbit',
    icon: '💍',
    characters: [
      'Frodo Bolsón', 'Gandalf', 'Aragorn', 'Legolas', 'Gimli',
      'Sam Gamyi', 'Merry', 'Pippin', 'Boromir', 'Gollum',
      'Sauron', 'Saruman', 'Bilbo Bolsón', 'Elrond', 'Galadriel',
      'Arwen', 'Éowyn', 'Éomer', 'Théoden', 'Faramir',
      'Treebeard', 'Smaug', 'Thorin Escudo de Roble', 'Rey Brujo de Angmar'
    ]
  },
  {
    id: 19,
    name: 'Cantantes Pop',
    description: 'Artistas de música pop internacional',
    icon: '🎤',
    characters: [
      'Michael Jackson', 'Madonna', 'Beyoncé', 'Taylor Swift', 'Rihanna',
      'Lady Gaga', 'Katy Perry', 'Ariana Grande', 'Justin Bieber', 'Bruno Mars',
      'Ed Sheeran', 'Adele', 'Shakira', 'Dua Lipa', 'The Weeknd',
      'Harry Styles', 'Billie Eilish', 'Miley Cyrus', 'Selena Gomez', 'Demi Lovato',
      'Whitney Houston', 'Mariah Carey', 'Celine Dion', 'BTS', 'BLACKPINK',
      'One Direction', 'Backstreet Boys', 'NSYNC', 'Spice Girls', 'Britney Spears'
    ]
  },
  {
    id: 20,
    name: 'Cantantes Reggaeton',
    description: 'Artistas de reggaeton y urbano',
    icon: '🎧',
    characters: [
      'Bad Bunny', 'J Balvin', 'Daddy Yankee', 'Ozuna', 'Maluma',
      'Anuel AA', 'Karol G', 'Nicky Jam', 'Farruko', 'Don Omar',
      'Wisin', 'Yandel', 'Arcángel', 'De La Ghetto', 'Rauw Alejandro',
      'Myke Towers', 'Jhay Cortez', 'Sech', 'Feid', 'Lunay',
      'Romeo Santos', 'Prince Royce', 'Becky G', 'Rosalía'
    ]
  },
  {
    id: 21,
    name: 'Cantantes Rock',
    description: 'Artistas y bandas de rock',
    icon: '🎸',
    characters: [
      'Freddie Mercury', 'Elvis Presley', 'Mick Jagger', 'John Lennon', 'Paul McCartney',
      'David Bowie', 'Prince', 'Kurt Cobain', 'Axl Rose', 'Slash',
      'Ozzy Osbourne', 'Robert Plant', 'Jimmy Page', 'Jimi Hendrix', 'Eric Clapton',
      'Bruce Springsteen', 'Bono', 'Eddie Vedder', 'Chester Bennington', 'Dave Grohl',
      'Anthony Kiedis', 'Chris Cornell', 'Tom Morello', 'Billie Joe Armstrong', 'Eminem',
      'Kanye West', 'Drake', 'Snoop Dogg', 'Jay-Z', 'Tupac Shakur'
    ]
  },
  {
    id: 22,
    name: 'Futbolistas',
    description: 'Jugadores de fútbol famosos',
    icon: '⚽',
    characters: [
      'Lionel Messi', 'Cristiano Ronaldo', 'Neymar Jr.', 'Kylian Mbappé', 'Erling Haaland',
      'Robert Lewandowski', 'Karim Benzema', 'Luka Modrić', 'Kevin De Bruyne', 'Mohamed Salah',
      'Sadio Mané', 'Virgil van Dijk', 'Sergio Ramos', 'Toni Kroos', 'Zinedine Zidane',
      'Ronaldinho', 'Ronaldo Nazário', 'Diego Maradona', 'Pelé', 'Johan Cruyff',
      'Franz Beckenbauer', 'Paolo Maldini', 'Andrea Pirlo', 'Xavi Hernández', 'Andrés Iniesta',
      'David Beckham', 'Thierry Henry', 'Zlatan Ibrahimović', 'Manuel Neuer', 'Gianluigi Buffon'
    ]
  },
  {
    id: 23,
    name: 'NBA',
    description: 'Jugadores de baloncesto de la NBA',
    icon: '🏀',
    characters: [
      'Michael Jordan', 'LeBron James', 'Kobe Bryant', 'Stephen Curry', 'Kevin Durant',
      'Shaquille ONeal', 'Magic Johnson', 'Larry Bird', 'Tim Duncan', 'Giannis Antetokounmpo',
      'Luka Dončić', 'Ja Morant', 'Joel Embiid', 'Nikola Jokić', 'Jayson Tatum',
      'Kawhi Leonard', 'James Harden', 'Russell Westbrook', 'Damian Lillard', 'Anthony Davis',
      'Kyrie Irving', 'Chris Paul', 'Dwyane Wade', 'Dirk Nowitzki', 'Allen Iverson',
      'Karl Malone', 'John Stockton', 'Hakeem Olajuwon', 'Charles Barkley', 'Dennis Rodman'
    ]
  },
  {
    id: 24,
    name: 'Videojuegos Nintendo',
    description: 'Personajes de juegos Nintendo',
    icon: '🍄',
    characters: [
      'Mario', 'Luigi', 'Princess Peach', 'Bowser', 'Yoshi',
      'Toad', 'Donkey Kong', 'Diddy Kong', 'Link', 'Zelda',
      'Ganondorf', 'Samus Aran', 'Kirby', 'Meta Knight', 'King Dedede',
      'Fox McCloud', 'Falco Lombardi', 'Captain Falcon', 'Ness', 'Lucas',
      'Pit', 'Palutena', 'Marth', 'Roy', 'Wario',
      'Waluigi', 'Rosalina', 'Isabelle', 'Tom Nook', 'Villager'
    ]
  },
  {
    id: 25,
    name: 'Videojuegos PlayStation',
    description: 'Personajes de exclusivos PlayStation',
    icon: '🎮',
    characters: [
      'Kratos', 'Atreus', 'Nathan Drake', 'Ellie', 'Joel',
      'Aloy', 'Spider-Man (Miles Morales)', 'Jin Sakai', 'Ratchet', 'Clank',
      'Sly Cooper', 'Jak', 'Daxter', 'Cloud Strife', 'Tifa Lockhart',
      'Aerith Gainsborough', 'Sephiroth', 'Crash Bandicoot', 'Spyro', 'Solid Snake',
      'Raiden', 'Kazuya Mishima', 'Heihachi Mishima', 'Dante', 'Nero',
      'Geralt de Rivia', 'Ciri', 'Leon S. Kennedy', 'Claire Redfield', 'Jill Valentine'
    ]
  },
  {
    id: 26,
    name: 'Pokémon',
    description: 'Pokémon y entrenadores',
    icon: '⚡',
    characters: [
      'Pikachu', 'Charizard', 'Mewtwo', 'Eevee', 'Gengar',
      'Snorlax', 'Lucario', 'Greninja', 'Blaziken', 'Garchomp',
      'Rayquaza', 'Dragonite', 'Gyarados', 'Alakazam', 'Machamp',
      'Blastoise', 'Venusaur', 'Jigglypuff', 'Squirtle', 'Bulbasaur',
      'Charmander', 'Mew', 'Arceus', 'Ash Ketchum', 'Misty',
      'Brock', 'Team Rocket (Jessie y James)', 'Professor Oak', 'Gary Oak', 'Cynthia'
    ]
  },
  {
    id: 27,
    name: 'Nickelodeon',
    description: 'Personajes de series Nickelodeon',
    icon: '🟠',
    characters: [
      'Tommy Pickles', 'Chuckie Finster', 'Angélica Pickles', 'Arnold', 'Helga Pataki',
      'CatDog', 'Ren y Stimpy', 'Jimmy Neutrón', 'Timmy Turner', 'Cosmo',
      'Wanda', 'Danny Phantom', 'El Tigre', 'Aang', 'Katara',
      'Sokka', 'Zuko', 'Toph', 'Korra', 'Invader Zim',
      'GIR', 'Drake y Josh', 'iCarly', 'Victorious (Tori Vega)'
    ]
  },
  {
    id: 28,
    name: 'Cartoon Network',
    description: 'Personajes de Cartoon Network',
    icon: '🟣',
    characters: [
      'Las Chicas Superpoderosas (Blossom)', 'Las Chicas Superpoderosas (Bubbles)', 'Las Chicas Superpoderosas (Buttercup)',
      'Mojo Jojo', 'Dexter', 'Dee Dee', 'Johnny Bravo', 'Vaca y Pollito',
      'Coraje el Perro Cobarde', 'Ed, Edd y Eddy', 'Billy y Mandy', 'Puro Hueso',
      'Ben 10', 'Gwen Tennyson', 'Kevin Levin', 'Finn el Humano', 'Jake el Perro',
      'Marceline', 'Princess Bubblegum', 'Ice King', 'Mordecai', 'Rigby',
      'Gumball Watterson', 'Darwin Watterson', 'Steven Universe', 'Garnet', 'Pearl',
      'Amethyst', 'Teen Titans (Robin)', 'Teen Titans (Starfire)'
    ]
  },
  {
    id: 29,
    name: 'Shrek y DreamWorks',
    description: 'Personajes de películas DreamWorks',
    icon: '🧅',
    characters: [
      'Shrek', 'Fiona', 'Burro', 'Gato con Botas', 'Lord Farquaad',
      'Príncipe Encantador', 'Hada Madrina', 'Pinocho', 'Los Tres Cerditos', 'Po (Kung Fu Panda)',
      'Tigresa', 'Master Shifu', 'Tai Lung', 'Alex (Madagascar)', 'Marty (Madagascar)',
      'Gloria (Madagascar)', 'Melman', 'Los Pingüinos', 'Rey Julien', 'Hiccup',
      'Toothless', 'Astrid', 'Metro Man', 'Megamind', 'Spirit',
      'Turbo', 'The Boss Baby', 'Mr. Peabody'
    ]
  },
  {
    id: 30,
    name: 'Películas de Terror',
    description: 'Villanos y personajes de terror',
    icon: '👻',
    characters: [
      'Freddy Krueger', 'Jason Voorhees', 'Michael Myers', 'Ghostface', 'Chucky',
      'Pennywise', 'Jigsaw', 'Leatherface', 'Hannibal Lecter', 'Norman Bates',
      'Jack Torrance', 'Regan MacNeil (El Exorcista)', 'Samara (The Ring)', 'Kayako (The Grudge)',
      'Annabelle', 'Valak (La Monja)', 'Art the Clown', 'Pinhead', 'Candyman',
      'Xenomorph (Alien)', 'Predator', 'Dracula', 'Frankenstein', 'La Momia',
      'El Hombre Lobo'
    ]
  },
  {
    id: 31,
    name: 'Películas de Acción',
    description: 'Héroes de películas de acción',
    icon: '💥',
    characters: [
      'John Wick', 'James Bond', 'Ethan Hunt', 'Jason Bourne', 'John McClane',
      'Terminator', 'RoboCop', 'Rambo', 'Rocky Balboa', 'Indiana Jones',
      'Mad Max', 'Neo', 'Trinity', 'Morpheus', 'John Connor',
      'Sarah Connor', 'Ellen Ripley', 'Dominic Toretto', 'Brian OConner', 'Hobbs',
      'Jack Reacher', 'Bryan Mills (Taken)', 'The Bride (Kill Bill)', 'John Rambo', 'Martin Riggs'
    ]
  },
  {
    id: 32,
    name: 'Comedia Romántica',
    description: 'Personajes de comedias románticas',
    icon: '💕',
    characters: [
      'Bridget Jones', 'Mr. Darcy', 'Elle Woods', 'Noah (The Notebook)', 'Allie (The Notebook)',
      'Julia Roberts (Pretty Woman)', 'Edward Lewis (Pretty Woman)', 'Harry Burns (When Harry Met Sally)',
      'Sally Albright', 'William Thacker (Notting Hill)', 'Anna Scott (Notting Hill)',
      'Tom Hansen (500 Days of Summer)', 'Summer Finn', 'Patrick Verona (10 Things I Hate)',
      'Kat Stratford', 'Joseph (Crazy Rich Asians)', 'Rachel Chu', 'Lara Jean', 'Peter Kavinsky',
      'Mia Thermopolis'
    ]
  },
  {
    id: 33,
    name: 'Youtubers',
    description: 'Creadores de contenido famosos',
    icon: '▶️',
    characters: [
      'PewDiePie', 'MrBeast', 'Rubius', 'AuronPlay', 'Ibai Llanos',
      'Fernanfloo', 'JuegaGerman', 'Luisito Comunica', 'Markiplier', 'Jacksepticeye',
      'Ninja', 'xQc', 'Pokimane', 'Mizkif', 'Ludwig',
      'Vegetta777', 'TheWillyrex', 'DjMariio', 'TheGrefg', 'KSI',
      'Logan Paul', 'Jake Paul', 'David Dobrik', 'Emma Chamberlain'
    ]
  },
  {
    id: 34,
    name: 'Personajes Históricos',
    description: 'Figuras importantes de la historia',
    icon: '📜',
    characters: [
      'Napoleón Bonaparte', 'Cleopatra', 'Julio César', 'Alejandro Magno', 'Leonardo da Vinci',
      'Albert Einstein', 'Isaac Newton', 'Galileo Galilei', 'Cristóbal Colón', 'Juana de Arco',
      'Genghis Khan', 'Marco Polo', 'William Shakespeare', 'Mozart', 'Beethoven',
      'Pablo Picasso', 'Abraham Lincoln', 'Martin Luther King', 'Mahatma Gandhi', 'Nelson Mandela',
      'Marie Curie', 'Charles Darwin', 'Nikola Tesla', 'Simón Bolívar', 'Winston Churchill',
      'George Washington', 'Thomas Edison', 'Benjamin Franklin', 'Confucio', 'Buda'
    ]
  },
  {
    id: 35,
    name: 'Mitología Griega',
    description: 'Dioses y héroes de la mitología',
    icon: '⚡',
    characters: [
      'Zeus', 'Poseidón', 'Hades', 'Atenea', 'Apolo',
      'Artemisa', 'Afrodita', 'Ares', 'Hermes', 'Hefesto',
      'Dioniso', 'Hera', 'Deméter', 'Perséfone', 'Hércules',
      'Aquiles', 'Odiseo (Ulises)', 'Perseo', 'Teseo', 'Jasón',
      'Helena de Troya', 'Medusa', 'Minotauro', 'Cíclope', 'Centauro',
      'Pegaso', 'Prometeo', 'Atlas', 'Cronos', 'Titanes'
    ]
  }
];

// Exportar categorías para uso directo
export const OFFLINE_CATEGORIES = OFFLINE_CATEGORIES_DATA;

// Función para obtener categoría por ID
export function getCategoryById(id) {
  return OFFLINE_CATEGORIES_DATA.find(cat => cat.id === id) || null;
}

// Función para obtener categorías formateadas para UI
export function getCategoriesForUI() {
  return OFFLINE_CATEGORIES_DATA.map(cat => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    icon: cat.icon,
    characterCount: cat.characters.length,
    characters: cat.characters
  }));
}

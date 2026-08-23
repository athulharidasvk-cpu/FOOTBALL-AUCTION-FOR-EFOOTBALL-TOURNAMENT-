// public/players.js

function p(name, club, position, rating, base, style) {
  return {
    name,
    club,
    position,
    rating,
    base,
    style
  };
}

module.exports = [

  // =========================
  // REAL MADRID
  // =========================
  p("Kylian Mbappe", "Real Madrid", "CF", 91, 45, "Goal Scorer"),
  p("Vinicius Junior", "Real Madrid", "LW", 90, 40, "Dribbler"),
  p("Jude Bellingham", "Real Madrid", "AMF", 90, 40, "Box to Box"),
  p("Rodrygo", "Real Madrid", "RWF", 86, 25, "Dribbler"),
  p("Federico Valverde", "Real Madrid", "CMF", 88, 28, "Box to Box"),
  p("Eduardo Camavinga", "Real Madrid", "DMF", 85, 20, "Ball Winner"),
  p("Aurelien Tchouameni", "Real Madrid", "DMF", 85, 20, "Anchor"),
  p("Arda Guler", "Real Madrid", "AMF", 82, 15, "Creative"),
  p("Brahim Diaz", "Real Madrid", "AMF", 84, 18, "Creative"),
  p("Antonio Rudiger", "Real Madrid", "CB", 87, 22, "Build Up"),
  p("Eder Militao", "Real Madrid", "CB", 86, 22, "Build Up"),
  p("David Alaba", "Real Madrid", "CB", 84, 18, "Build Up"),
  p("Ferland Mendy", "Real Madrid", "LB", 82, 14, "Defensive"),
  p("Dani Carvajal", "Real Madrid", "RB", 84, 16, "Offensive"),
  p("Thibaut Courtois", "Real Madrid", "GK", 90, 25, "Shot Stopper"),

  // =========================
  // BARCELONA
  // =========================
  p("Robert Lewandowski", "Barcelona", "CF", 90, 38, "Goal Poacher"),
  p("Lamine Yamal", "Barcelona", "RWF", 88, 35, "Creative"),
  p("Raphinha", "Barcelona", "LWF", 87, 28, "Dribbler"),
  p("Pedri", "Barcelona", "CMF", 88, 30, "Creative"),
  p("Gavi", "Barcelona", "CMF", 84, 20, "Box to Box"),
  p("Frenkie de Jong", "Barcelona", "CMF", 87, 25, "Orchestrator"),
  p("Dani Olmo", "Barcelona", "AMF", 85, 22, "Creative"),
  p("Ferran Torres", "Barcelona", "CF", 82, 14, "Goal Poacher"),
  p("Pau Cubarsi", "Barcelona", "CB", 82, 15, "Build Up"),
  p("Ronald Araujo", "Barcelona", "CB", 86, 22, "Destroyer"),
  p("Jules Kounde", "Barcelona", "RB", 86, 22, "Defensive"),
  p("Alejandro Balde", "Barcelona", "LB", 82, 14, "Offensive"),
  p("Marc-Andre ter Stegen", "Barcelona", "GK", 88, 22, "Offensive GK"),

  // =========================
  // MANCHESTER CITY
  // =========================
  p("Erling Haaland", "Manchester City", "CF", 92, 50, "Goal Poacher"),
  p("Phil Foden", "Manchester City", "AMF", 88, 32, "Creative"),
  p("Kevin De Bruyne", "Manchester City", "AMF", 89, 35, "Creative"),
  p("Bernardo Silva", "Manchester City", "AMF", 88, 30, "Creative"),
  p("Rodri", "Manchester City", "DMF", 91, 40, "Anchor"),
  p("Jack Grealish", "Manchester City", "LWF", 84, 20, "Dribbler"),
  p("Jeremy Doku", "Manchester City", "LWF", 84, 20, "Dribbler"),
  p("Savinho", "Manchester City", "RWF", 82, 16, "Dribbler"),
  p("Mateo Kovacic", "Manchester City", "CMF", 84, 18, "Orchestrator"),
  p("Ruben Dias", "Manchester City", "CB", 88, 28, "Build Up"),
  p("John Stones", "Manchester City", "CB", 85, 20, "Build Up"),
  p("Josko Gvardiol", "Manchester City", "CB", 85, 20, "Build Up"),
  p("Kyle Walker", "Manchester City", "RB", 83, 15, "Defensive"),
  p("Ederson", "Manchester City", "GK", 88, 24, "Offensive GK"),

  // =========================
  // LIVERPOOL
  // =========================
  p("Mohamed Salah", "Liverpool", "RWF", 90, 40, "Goal Poacher"),
  p("Luis Diaz", "Liverpool", "LWF", 86, 25, "Dribbler"),
  p("Darwin Nunez", "Liverpool", "CF", 84, 22, "Goal Poacher"),
  p("Cody Gakpo", "Liverpool", "LWF", 84, 20, "Goal Scorer"),
  p("Dominik Szoboszlai", "Liverpool", "AMF", 85, 22, "Box to Box"),
  p("Alexis Mac Allister", "Liverpool", "CMF", 86, 24, "Orchestrator"),
  p("Ryan Gravenberch", "Liverpool", "CMF", 83, 17, "Box to Box"),
  p("Curtis Jones", "Liverpool", "CMF", 82, 15, "Creative"),
  p("Virgil van Dijk", "Liverpool", "CB", 89, 30, "Build Up"),
  p("Ibrahima Konate", "Liverpool", "CB", 85, 20, "Destroyer"),
  p("Andrew Robertson", "Liverpool", "LB", 85, 20, "Offensive"),
  p("Trent Alexander-Arnold", "Liverpool", "RB", 87, 25, "Cross Specialist"),
  p("Alisson Becker", "Liverpool", "GK", 89, 28, "Shot Stopper"),

  // =========================
  // ARSENAL
  // =========================
  p("Bukayo Saka", "Arsenal", "RWF", 88, 32, "Dribbler"),
  p("Martin Odegaard", "Arsenal", "AMF", 88, 30, "Creative"),
  p("Declan Rice", "Arsenal", "DMF", 88, 30, "Box to Box"),
  p("Kai Havertz", "Arsenal", "CF", 84, 20, "Goal Poacher"),
  p("Gabriel Martinelli", "Arsenal", "LWF", 84, 20, "Dribbler"),
  p("Gabriel Jesus", "Arsenal", "CF", 82, 16, "Goal Poacher"),
  p("William Saliba", "Arsenal", "CB", 87, 25, "Build Up"),
  p("Gabriel Magalhaes", "Arsenal", "CB", 86, 22, "Destroyer"),
  p("Ben White", "Arsenal", "RB", 84, 18, "Build Up"),
  p("Jurrien Timber", "Arsenal", "CB", 82, 15, "Build Up"),
  p("Oleksandr Zinchenko", "Arsenal", "LB", 82, 15, "Creative"),
  p("David Raya", "Arsenal", "GK", 84, 18, "Offensive GK"),

  // =========================
  // CHELSEA
  // =========================
  p("Cole Palmer", "Chelsea", "AMF", 89, 35, "Creative"),
  p("Christopher Nkunku", "Chelsea", "SS", 84, 18, "Dribbler"),
  p("Nicolas Jackson", "Chelsea", "CF", 83, 17, "Goal Poacher"),
  p("Pedro Neto", "Chelsea", "RWF", 84, 18, "Dribbler"),
  p("Enzo Fernandez", "Chelsea", "CMF", 85, 22, "Orchestrator"),
  p("Moises Caicedo", "Chelsea", "DMF", 84, 20, "Anchor"),
  p("Romeo Lavia", "Chelsea", "DMF", 80, 12, "Anchor"),
  p("Malo Gusto", "Chelsea", "RB", 82, 14, "Offensive"),
  p("Reece James", "Chelsea", "RB", 84, 18, "Cross Specialist"),
  p("Levi Colwill", "Chelsea", "CB", 82, 15, "Build Up"),
  p("Wesley Fofana", "Chelsea", "CB", 82, 15, "Destroyer"),
  p("Marc Cucurella", "Chelsea", "LB", 82, 14, "Offensive"),
  p("Robert Sanchez", "Chelsea", "GK", 80, 12, "Shot Stopper"),

  // =========================
  // MANCHESTER UNITED
  // =========================
  p("Bruno Fernandes", "Manchester United", "AMF", 88, 32, "Creative"),
  p("Marcus Rashford", "Manchester United", "LWF", 83, 18, "Goal Scorer"),
  p("Rasmus Hojlund", "Manchester United", "CF", 82, 17, "Goal Poacher"),
  p("Alejandro Garnacho", "Manchester United", "LWF", 84, 22, "Dribbler"),
  p("Mason Mount", "Manchester United", "AMF", 80, 13, "Creative"),
  p("Casemiro", "Manchester United", "DMF", 83, 15, "Anchor"),
  p("Kobbie Mainoo", "Manchester United", "CMF", 82, 16, "Box to Box"),
  p("Manuel Ugarte", "Manchester United", "DMF", 82, 16, "Ball Winner"),
  p("Lisandro Martinez", "Manchester United", "CB", 84, 20, "Build Up"),
  p("Matthijs de Ligt", "Manchester United", "CB", 84, 20, "Destroyer"),
  p("Harry Maguire", "Manchester United", "CB", 81, 12, "Build Up"),
  p("Diogo Dalot", "Manchester United", "RB", 82, 14, "Offensive"),
  p("Andre Onana", "Manchester United", "GK", 83, 16, "Offensive GK"),

  // =========================
  // BAYERN MUNICH
  // =========================
  p("Harry Kane", "Bayern Munich", "CF", 91, 42, "Goal Poacher"),
  p("Jamal Musiala", "Bayern Munich", "AMF", 90, 38, "Dribbler"),
  p("Michael Olise", "Bayern Munich", "RWF", 86, 25, "Creative"),
  p("Kingsley Coman", "Bayern Munich", "LWF", 84, 20, "Dribbler"),
  p("Serge Gnabry", "Bayern Munich", "RWF", 83, 18, "Goal Scorer"),
  p("Leroy Sane", "Bayern Munich", "RWF", 85, 22, "Dribbler"),
  p("Joshua Kimmich", "Bayern Munich", "DMF", 88, 30, "Orchestrator"),
  p("Leon Goretzka", "Bayern Munich", "CMF", 84, 18, "Box to Box"),
  p("Konrad Laimer", "Bayern Munich", "CMF", 82, 15, "Ball Winner"),
  p("Alphonso Davies", "Bayern Munich", "LB", 86, 22, "Offensive"),
  p("Dayot Upamecano", "Bayern Munich", "CB", 84, 18, "Destroyer"),
  p("Kim Min-Jae", "Bayern Munich", "CB", 85, 20, "Build Up"),
  p("Manuel Neuer", "Bayern Munich", "GK", 87, 22, "Offensive GK"),

  // =========================
  // PSG
  // =========================
  p("Ousmane Dembele", "PSG", "RWF", 89, 35, "Dribbler"),
  p("Khvicha Kvaratskhelia", "PSG", "LWF", 87, 30, "Dribbler"),
  p("Bradley Barcola", "PSG", "LWF", 84, 20, "Dribbler"),
  p("Goncalo Ramos", "PSG", "CF", 83, 18, "Goal Poacher"),
  p("Desire Doue", "PSG", "AMF", 82, 16, "Creative"),
  p("Vitinha", "PSG", "CMF", 87, 25, "Orchestrator"),
  p("Joao Neves", "PSG", "CMF", 85, 22, "Box to Box"),
  p("Warren Zaire-Emery", "PSG", "CMF", 83, 18, "Box to Box"),
  p("Achraf Hakimi", "PSG", "RB", 87, 25, "Offensive"),
  p("Marquinhos", "PSG", "CB", 87, 24, "Build Up"),
  p("Lucas Hernandez", "PSG", "CB", 83, 17, "Destroyer"),
  p("Nuno Mendes", "PSG", "LB", 85, 20, "Offensive"),
  p("Gianluigi Donnarumma", "PSG", "GK", 89, 25, "Shot Stopper"),

  // =========================
  // INTER MILAN
  // =========================
  p("Lautaro Martinez", "Inter Milan", "CF", 89, 32, "Goal Poacher"),
  p("Marcus Thuram", "Inter Milan", "CF", 86, 24, "Goal Scorer"),
  p("Nicolo Barella", "Inter Milan", "CMF", 87, 25, "Box to Box"),
  p("Hakan Calhanoglu", "Inter Milan", "DMF", 87, 24, "Orchestrator"),
  p("Henrikh Mkhitaryan", "Inter Milan", "CMF", 81, 12, "Creative"),
  p("Piotr Zielinski", "Inter Milan", "CMF", 82, 14, "Creative"),
  p("Federico Dimarco", "Inter Milan", "LWB", 86, 20, "Cross Specialist"),
  p("Denzel Dumfries", "Inter Milan", "RWB", 84, 18, "Offensive"),
  p("Alessandro Bastoni", "Inter Milan", "CB", 87, 24, "Build Up"),
  p("Benjamin Pavard", "Inter Milan", "CB", 84, 18, "Build Up"),
  p("Francesco Acerbi", "Inter Milan", "CB", 81, 12, "Destroyer"),
  p("Yann Sommer", "Inter Milan", "GK", 85, 18, "Shot Stopper"),

  // =========================
  // AC MILAN
  // =========================
  p("Rafael Leao", "AC Milan", "LWF", 88, 30, "Dribbler"),
  p("Christian Pulisic", "AC Milan", "RWF", 84, 20, "Dribbler"),
  p("Alvaro Morata", "AC Milan", "CF", 82, 15, "Goal Poacher"),
  p("Ruben Loftus-Cheek", "AC Milan", "CMF", 80, 12, "Box to Box"),
  p("Tijjani Reijnders", "AC Milan", "CMF", 84, 18, "Orchestrator"),
  p("Youssouf Fofana", "AC Milan", "DMF", 82, 15, "Ball Winner"),
  p("Theo Hernandez", "AC Milan", "LB", 87, 25, "Offensive"),
  p("Fikayo Tomori", "AC Milan", "CB", 83, 17, "Destroyer"),
  p("Matteo Gabbia", "AC Milan", "CB", 79, 10, "Build Up"),
  p("Mike Maignan", "AC Milan", "GK", 88, 24, "Shot Stopper"),

  // =========================
  // JUVENTUS
  // =========================
  p("Dusan Vlahovic", "Juventus", "CF", 85, 23, "Goal Poacher"),
  p("Kenan Yildiz", "Juventus", "SS", 83, 18, "Creative"),
  p("Federico Chiesa", "Juventus", "LWF", 84, 20, "Dribbler"),
  p("Teun Koopmeiners", "Juventus", "CMF", 85, 20, "Orchestrator"),
  p("Douglas Luiz", "Juventus", "DMF", 83, 17, "Anchor"),
  p("Manuel Locatelli", "Juventus", "DMF", 82, 14, "Orchestrator"),
  p("Khephren Thuram", "Juventus", "CMF", 82, 15, "Box to Box"),
  p("Andrea Cambiaso", "Juventus", "LB", 82, 14, "Offensive"),
  p("Gleison Bremer", "Juventus", "CB", 86, 22, "Destroyer"),
  p("Danilo", "Juventus", "CB", 81, 12, "Build Up"),
  p("Pierre Kalulu", "Juventus", "CB", 80, 11, "Defensive"),
  p("Michele Di Gregorio", "Juventus", "GK", 82, 14, "Shot Stopper"),

  // =========================
  // ATLETICO MADRID
  // =========================
  p("Antoine Griezmann", "Atletico Madrid", "SS", 88, 30, "Creative"),
  p("Julian Alvarez", "Atletico Madrid", "CF", 88, 30, "Goal Poacher"),
  p("Alexander Sorloth", "Atletico Madrid", "CF", 84, 18, "Target Man"),
  p("Angel Correa", "Atletico Madrid", "SS", 82, 14, "Creative"),
  p("Marcos Llorente", "Atletico Madrid", "CMF", 84, 18, "Box to Box"),
  p("Rodrigo De Paul", "Atletico Madrid", "CMF", 84, 18, "Orchestrator"),
  p("Conor Gallagher", "Atletico Madrid", "CMF", 82, 16, "Box to Box"),
  p("Koke", "Atletico Madrid", "CMF", 82, 13, "Orchestrator"),
  p("Jose Gimenez", "Atletico Madrid", "CB", 84, 18, "Destroyer"),
  p("Robin Le Normand", "Atletico Madrid", "CB", 83, 16, "Build Up"),
  p("Nahuel Molina", "Atletico Madrid", "RB", 82, 14, "Offensive"),
  p("Jan Oblak", "Atletico Madrid", "GK", 88, 23, "Shot Stopper"),

  // =========================
  // BORUSSIA DORTMUND
  // =========================
  p("Serhou Guirassy", "Dortmund", "CF", 84, 18, "Goal Poacher"),
  p("Karim Adeyemi", "Dortmund", "LWF", 82, 16, "Speedster"),
  p("Jamie Gittens", "Dortmund", "LWF", 81, 15, "Dribbler"),
  p("Julian Brandt", "Dortmund", "AMF", 84, 18, "Creative"),
  p("Marcel Sabitzer", "Dortmund", "CMF", 82, 14, "Box to Box"),
  p("Emre Can", "Dortmund", "DMF", 81, 12, "Anchor"),
  p("Felix Nmecha", "Dortmund", "CMF", 80, 11, "Box to Box"),
  p("Nico Schlotterbeck", "Dortmund", "CB", 84, 18, "Build Up"),
  p("Niklas Sule", "Dortmund", "CB", 82, 14, "Destroyer"),
  p("Waldemar Anton", "Dortmund", "CB", 81, 12, "Build Up"),
  p("Julian Ryerson", "Dortmund", "RB", 80, 11, "Defensive"),
  p("Gregor Kobel", "Dortmund", "GK", 87, 22, "Shot Stopper"),

  // =========================
  // LEVERKUSEN
  // =========================
  p("Florian Wirtz", "Leverkusen", "AMF", 90, 38, "Creative"),
  p("Victor Boniface", "Leverkusen", "CF", 84, 20, "Goal Poacher"),
  p("Patrik Schick", "Leverkusen", "CF", 83, 16, "Target Man"),
  p("Jeremie Frimpong", "Leverkusen", "RWB", 86, 22, "Offensive"),
  p("Granit Xhaka", "Leverkusen", "DMF", 85, 18, "Orchestrator"),
  p("Aleix Garcia", "Leverkusen", "CMF", 82, 13, "Orchestrator"),
  p("Exequiel Palacios", "Leverkusen", "CMF", 83, 15, "Box to Box"),
  p("Jonathan Tah", "Leverkusen", "CB", 84, 17, "Build Up"),
  p("Edmond Tapsoba", "Leverkusen", "CB", 84, 17, "Build Up"),
  p("Piero Hincapie", "Leverkusen", "CB", 82, 14, "Defensive"),
  p("Alejandro Grimaldo", "Leverkusen", "LB", 86, 22, "Cross Specialist"),
  p("Lukas Hradecky", "Leverkusen", "GK", 83, 14, "Shot Stopper"),

  // =========================
  // NAPOLI
  // =========================
  p("Romelu Lukaku", "Napoli", "CF", 84, 18, "Target Man"),
  p("Khvicha Kvaratskhelia", "Napoli", "LWF", 87, 28, "Dribbler"),
  p("Matteo Politano", "Napoli", "RWF", 82, 14, "Dribbler"),
  p("Scott McTominay", "Napoli", "CMF", 83, 17, "Box to Box"),
  p("Stanislav Lobotka", "Napoli", "DMF", 84, 16, "Orchestrator"),
  p("Frank Anguissa", "Napoli", "CMF", 82, 14, "Ball Winner"),
  p("Alessandro Buongiorno", "Napoli", "CB", 83, 16, "Build Up"),
  p("Amir Rrahmani", "Napoli", "CB", 81, 12, "Destroyer"),
  p("Giovanni Di Lorenzo", "Napoli", "RB", 83, 14, "Offensive"),
  p("Alex Meret", "Napoli", "GK", 82, 13, "Shot Stopper"),

  // =========================
  // PORTUGAL / BENFICA / SPORTING
  // =========================
  p("Viktor Gyokeres", "Sporting CP", "CF", 88, 30, "Goal Poacher"),
  p("Pedro Goncalves", "Sporting CP", "AMF", 84, 18, "Creative"),
  p("Trincao", "Sporting CP", "RWF", 82, 15, "Dribbler"),
  p("Geovany Quenda", "Sporting CP", "RWF", 79, 10, "Dribbler"),
  p("Ruben Amorim", "Sporting CP", "AMF", 75, 5, "Creative"),
  p("Angel Di Maria", "Benfica", "RWF", 84, 16, "Cross Specialist"),
  p("Orkun Kokcu", "Benfica", "CMF", 83, 16, "Orchestrator"),
  p("Kerem Akturkoglu", "Benfica", "LWF", 82, 15, "Dribbler"),
  p("Antonio Silva", "Benfica", "CB", 83, 17, "Build Up"),
  p("Nicolas Otamendi", "Benfica", "CB", 80, 10, "Destroyer"),

  // =========================
  // PREMIER LEAGUE
  // =========================
  p("Son Heung-min", "Tottenham", "LWF", 87, 28, "Goal Scorer"),
  p("James Maddison", "Tottenham", "AMF", 84, 18, "Creative"),
  p("Cristian Romero", "Tottenham", "CB", 85, 20, "Destroyer"),
  p("Micky van de Ven", "Tottenham", "CB", 83, 17, "Build Up"),
  p("Pedro Porro", "Tottenham", "RB", 84, 17, "Offensive"),

  p("Nicolas Jackson", "Chelsea", "CF", 83, 17, "Goal Poacher"),
  p("Anthony Gordon", "Newcastle", "LWF", 84, 19, "Dribbler"),
  p("Alexander Isak", "Newcastle", "CF", 88, 30, "Goal Poacher"),
  p("Bruno Guimaraes", "Newcastle", "DMF", 86, 22, "Box to Box"),
  p("Sandro Tonali", "Newcastle", "CMF", 84, 18, "Orchestrator"),
  p("William Osula", "Newcastle", "CF", 76, 7, "Goal Poacher"),

  p("Ollie Watkins", "Aston Villa", "CF", 85, 20, "Goal Poacher"),
  p("Morgan Rogers", "Aston Villa", "AMF", 82, 15, "Dribbler"),
  p("Youri Tielemans", "Aston Villa", "CMF", 83, 15, "Orchestrator"),
  p("John McGinn", "Aston Villa", "CMF", 83, 14, "Box to Box"),
  p("Emiliano Martinez", "Aston Villa", "GK", 86, 20, "Shot Stopper"),

  p("Kaoru Mitoma", "Brighton", "LWF", 84, 18, "Dribbler"),
  p("Joao Pedro", "Brighton", "CF", 81, 14, "Goal Poacher"),
  p("Yankuba Minteh", "Brighton", "RWF", 79, 10, "Dribbler"),

  p("Mohammed Kudus", "West Ham", "AMF", 84, 18, "Dribbler"),
  p("Lucas Paqueta", "West Ham", "AMF", 84, 18, "Creative"),
  p("Jarrod Bowen", "West Ham", "RWF", 83, 17, "Goal Scorer"),

  // =========================
  // MORE TOP PLAYERS
  // =========================
  p("Kevin Volland", "Monaco", "CF", 79, 9, "Goal Poacher"),
  p("Breel Embolo", "Monaco", "CF", 80, 10, "Target Man"),
  p("Denis Zakaria", "Monaco", "DMF", 81, 12, "Ball Winner"),
  p("Folarin Balogun", "Monaco", "CF", 80, 11, "Goal Poacher"),

  p("Mikel Merino", "Real Sociedad", "CMF", 84, 17, "Box to Box"),
  p("Takefusa Kubo", "Real Sociedad", "RWF", 84, 19, "Dribbler"),
  p("Martin Zubimendi", "Real Sociedad", "DMF", 85, 19, "Anchor"),

  p("Mikel Oyarzabal", "Real Sociedad", "LWF", 83, 15, "Goal Scorer"),
  p("Dani Vivian", "Athletic Bilbao", "CB", 81, 11, "Destroyer"),
  p("Nico Williams", "Athletic Bilbao", "LWF", 86, 23, "Dribbler"),
  p("Inaki Williams", "Athletic Bilbao", "RWF", 82, 14, "Speedster"),

  p("Isco", "Real Betis", "AMF", 84, 16, "Creative"),
  p("Giovani Lo Celso", "Real Betis", "AMF", 82, 13, "Creative"),
  p("Ayoze Perez", "Real Betis", "CF", 81, 12, "Goal Poacher"),

  // =========================
  // GOALKEEPERS
  // =========================
  p("Emiliano Martinez", "Argentina", "GK", 86, 20, "Shot Stopper"),
  p("Emiliano Martinez", "Aston Villa", "GK", 86, 20, "Shot Stopper"),
  p("Mike Maignan", "France", "GK", 88, 24, "Shot Stopper"),
  p("Gianluigi Donnarumma", "Italy", "GK", 89, 25, "Shot Stopper"),
  p("Jan Oblak", "Slovenia", "GK", 88, 23, "Shot Stopper"),
  p("Alisson Becker", "Brazil", "GK", 89, 28, "Shot Stopper"),
  p("Ederson", "Brazil", "GK", 88, 24, "Offensive GK"),
  p("Thibaut Courtois", "Belgium", "GK", 90, 25, "Shot Stopper"),
  p("Marc-Andre ter Stegen", "Germany", "GK", 88, 22, "Offensive GK"),
  p("Diogo Costa", "Portugal", "GK", 84, 17, "Offensive GK"),
  p("Unai Simon", "Spain", "GK", 84, 16, "Shot Stopper"),
  p("Gregor Kobel", "Switzerland", "GK", 87, 22, "Shot Stopper"),

  // =========================
  // INTERNATIONAL STARS
  // =========================
  p("Lionel Messi", "Argentina", "RWF", 90, 45, "Creative"),
  p("Cristiano Ronaldo", "Portugal", "CF", 89, 40, "Goal Poacher"),
  p("Neymar Jr", "Brazil", "LWF", 86, 30, "Dribbler"),
  p("Luka Modric", "Croatia", "CMF", 85, 18, "Orchestrator"),
  p("Toni Kroos", "Germany", "CMF", 85, 18, "Orchestrator"),
  p("Sergio Ramos", "Spain", "CB", 82, 12, "Destroyer"),
  p("Sergio Busquets", "Spain", "DMF", 83, 12, "Anchor"),
  p("Thomas Muller", "Germany", "SS", 82, 12, "Goal Poacher"),
  p("Manuel Neuer", "Germany", "GK", 87, 22, "Offensive GK"),
  p("Thiago Silva", "Brazil", "CB", 81, 10, "Build Up"),
  p("Angel Di Maria", "Argentina", "RWF", 84, 16, "Cross Specialist"),
  p("Paulo Dybala", "Argentina", "SS", 86, 22, "Creative"),
  p("Lautaro Martinez", "Argentina", "CF", 89, 32, "Goal Poacher"),
  p("Romelu Lukaku", "Belgium", "CF", 84, 18, "Target Man"),
  p("Kevin De Bruyne", "Belgium", "AMF", 89, 35, "Creative"),
  p("Antoine Griezmann", "France", "SS", 88, 30, "Creative"),
  p("Olivier Giroud", "France", "CF", 80, 10, "Target Man"),
  p("N'Golo Kante", "France", "DMF", 82, 12, "Ball Winner"),
  p("Paul Pogba", "France", "CMF", 80, 10, "Box to Box"),
  p("Karim Benzema", "France", "CF", 84, 18, "Goal Poacher"),
  p("Luis Suarez", "Uruguay", "CF", 81, 10, "Goal Poacher"),
  p("Edinson Cavani", "Uruguay", "CF", 79, 8, "Goal Poacher")

  ];
  

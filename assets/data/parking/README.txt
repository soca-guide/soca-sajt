PARKIRANJE – kako dodati, izmeniti ili obrisati kartice
=====================================================

LIST.TXT
  Redosled kartica = redosled linija u ovom fajlu.
  Jedna linija = jedan ID (ime fajla bez .json).

BRISANJE kartice
  1. Obriši jedan red iz list.txt (npr. ceo red "bovec-sport").
  2. Opciono obriši i fajl bovec-sport.json iz ovog foldera.
  Nemoj dirati zagradu ili zarez u drugim fajlovima.

DODAVANJE nove kartice
  1. Kopiraj neki postojeći .json (npr. bovec-center.json).
  2. Preimenuj u novi-id.json (npr. novo-parkiraliste.json).
  3. U njemu izmeni sve podatke (id, title, address, town, type, paid, hours, notes, mapsQuery).
  4. U list.txt dodaj jednu novu liniju: novi-id (npr. novo-parkiraliste).

IZMENA
  Otvori samo jedan .json fajl i promeni tekst. Ostalo ne diraj.

Polja u svakom .json:
  id – isto kao ime fajla (bez .json)
  title – naziv po jezicima: sl, en, de, it
  address – adresa na kartici
  town – Bovec / Kobarid / Tolmin (filtrira se po lokaciji apartmana)
  type – "apartment" (prikazuje se pod Priporočeno) ili "public"
  paid – true / false
  hours – npr. "24/7"
  notes – opombe po jezicima
  mapsQuery – adresa za Google Maps

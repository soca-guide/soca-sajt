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
  3. U njemu izmeni sve podatke (vidi polja ispod).
  4. U list.txt dodaj jednu novu liniju: novi-id (npr. novo-parkiraliste).

IZMENA
  Otvori samo jedan .json fajl i promeni šta ti treba. Sve može da se menja.

Polja u svakom .json (sve je menjivo):
  id – isto kao ime fajla (bez .json)
  title – naziv po jezicima: sl, en, de, it
  address – adresa koja se prikazuje na kartici
  town – Bovec / Kobarid / Tolmin (koje mesto vidi ovu karticu)
  type – "apartment" (prikazuje se pod Priporočeno) ili "public"
  paid – true (plačljivo) ili false (besplatno)
  hours – npr. "24/7"
  notes – opombe po jezicima: sl, en, de, it
  mapsQuery – adresa za Google Maps (koristi se ako nema mapsLink)
  mapsLink – PUN URL link za dugme "Lokacija". Ako staviš ovde link, dugme vodi tačno na njega (npr. Google Maps, bilo koji sajt). Ako izostaviš mapsLink, link se pravi automatski iz mapsQuery.

# GraphQL & Websocket ZH kezdőcsomag

Kezdőcsomag a Szerveroldali webprogramozás tárgy GraphQL & Websocket (Socket.IO) zárthelyi feladatához.

- [GraphQL & Websocket ZH kezdőcsomag](#graphql--websocket-zh-kezdőcsomag)
  - [Függőségek telepítése](#függőségek-telepítése)
    - [Csomagok telepítése](#csomagok-telepítése)
    - [Node.js telepítése](#nodejs-telepítése)
    - [Hiba a csomagok telepítéskor](#hiba-a-csomagok-telepítéskor)
      - [SQLite hiba](#sqlite-hiba)
  - [Kezdőcsomag parancsok](#kezdőcsomag-parancsok)
  - [Ajánlott kliensek](#ajánlott-kliensek)
  - [Ajánlott kiegészítők](#ajánlott-kiegészítők)
  - [Automatikus formázás mentéskor](#automatikus-formázás-mentéskor)
  - [Automatikus tesztelő, tudnivalók](#automatikus-tesztelő-tudnivalók)
    - [Tesztelő telepítése a zárthelyi elején](#tesztelő-telepítése-a-zárthelyi-elején)
    - [Fontos tudnivalók](#fontos-tudnivalók)
  - [Automatikus zippelő, beadás](#automatikus-zippelő-beadás)

## Függőségek telepítése

### Csomagok telepítése

Ez a kezdőcsomag teljes mértékben elő van készítve, ezért a használatba vételéhez mindössze az NPM-es csomagok telepítésére van szükség, amit az alábbi parancsok valamelyikének kiadásával tehetsz meg:

```
npm i --legacy-peer-deps VAGY npm install --legacy-peer-deps
```

A csomagok telepítését érdemes jóval a ZH kezdete előtt elvégezni, hogyha bármilyen okból nem sikerül, akkor legyen időd megoldani a hibát, vagy felvenni a gyakorlatvezetőddel a kapcsolatot.

### Node.js telepítése

Ha a gépeden nem elérhető az `npm` parancs, akkor telepítened kell a [Node.js](https://nodejs.org/en/)-t, ehhez elég az LTS verzió.

Telepítéskor érdemes előre feltenni a kiegészítő tool-okat (lásd a későbbi hibák fejezetet):
![Build tools](https://i.imgur.com/pgNyM4Z.png)

### Hiba a csomagok telepítéskor

#### SQLite hiba
Ha az SQLite modulra hibát ír a telepítéskor, az többnyire azért van, mert nem tudja letölteni az előre build-elt binárisokat tartalmazó zip-et az Amazon AWS szerveréről, emiatt automatikusan a gépeden szeretne csinálni egy buildet a forráskódról, azonban ehhez nincsenek telepítve a megfelelő függőségek.

Ilyenkor az alábbiakat kell telepíteni:
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=BuildTools)
  - Ez nem egy Visual Studio, csak azok a build eszközök, amiket a Visual Studio is használ
- [A Python3 legfrissebb stable kiadását](https://www.python.org/downloads/windows/)
  - Telepítéskor ezt hozzá kell adni a környezeti változókhoz (`PYTHON` néven)

Bővebben lásd itt: [node-gyp Windows függőségek](https://github.com/nodejs/node-gyp#on-windows)

## Kezdőcsomag parancsok

Miután telepítetted az NPM-es csomagokat, az alábbi parancsok érhetők el a kezdőcsomagon belül:

- GraphQL:
  - `npm run gql:db`: Migrációk és a seeder futtatása nulláról (tiszta adatbázis)
  - `npm run gql:dev`: GraphQL szerver futtatása (fejlesztői)
  - `npm run gql:test`: Automata tesztelő futtatása a GraphQL feladatra
  - `npm run gql:test 1 2`: Automata tesztelő futtatása a GraphQL feladat konkrét részfeladataira a feladatok sorszáma alapján
- Websocket:
  - `npm run ws:dev`: Websocket (Socket.IO) szerver futtatása (fejlesztői)
  - `npm run ws:test`: Automata tesztelő futtatása a Websocket feladatra
  - `npm run ws:test 1 2`: Automata tesztelő futtatása a Websocket feladat konkrét részfeladataira a feladatok sorszáma alapján
- `npm run zip`: ZH becsomagolása (automatikus nyilatkozat ellenőrzéssel és kitöltéssel)
- `npm run prettier`: A projektben lévő összes `.js`, `.json` és `.graphql` fájl formázása Prettier-el

## Ajánlott kliensek

- GraphQL: Ehhez két beépített klienst is ad a kezdőcsomag, javasolt a Playground használata
  - GraphiQL: http://localhost:4000/graphql
  - Playground: http://localhost:4000/playground
- Websocket (Socket.IO):
  - Postman
  - Firecamp

## Ajánlott kiegészítők

A kezdőcsomaghoz vannak ajánlott VSCode kiegészítők (lásd `./vscode/extensions.json`). Amikor először megnyitod VSCode-al a kezdőcsomagot, jobb alul felkínálja, hogy telepítsd őket. Ha nem, utólag is megtalálod őket a kiegészítők között "Workspace recommendations" néven:

![Workspace recommendations](https://i.imgur.com/NVjs2RX.png)
## Automatikus formázás mentéskor

Ha telepítetted az ajánlott kiegészítőket, köztük a Prettier plugint, akkor ha a kiegészítő beállításai között vagy a `./vscode/settings.json`-ben módosítod az automatikus mentést így (formatOnSave legyen true):

```json
"[javascript]": {
    "editor.formatOnSave": true
}
```

Akkor ha elmentesz egy fájlt a VSCode-ban, a Prettier automatikusan meghívásra kerül rá és megformázza a fájlban lévő kódot.

## Automatikus tesztelő, tudnivalók

A zárthelyihez automata tesztelőt biztosítunk, ami segít gyors visszajelzést adni a munkádról.

![Tesztelő](https://imgur.com/7nJ6XvT.png)

### Tesztelő telepítése a zárthelyi elején

A kezdőcsomagban alapból csak üres tesztelők vannak. A konkrét zárthelyi feladatokhoz tartozó tesztelőket a kezdés időpontjában osztjuk meg. A tartalmát be kell másolni a kezdőcsomag főmappájába, felülírva a már ott lévő fájlokat.

Ez alapvetően két fájlt jelent tesztelőnként:
- `inject.js`
  - A kezdőcsomag használja szerveroldalon, annak érdekében, hogy a tesztelő megfelelően el tudja indítani a teszt szervert és a kliens oldali tesztelést is hatékonyan elvégezhesse. Ez eltérő megoldásokat jelenthet REST API-nál, GraphQL-nél vagy Websocket-nál.
- `tester.js`
  - Maga a tesztelő

Ha zárthelyi közben valamiért módosítjuk és újra kiadjuk a tesztelőt, mondjuk egy időközben javított hiba miatt, akkor ugyanígy felül kell írni ismét.

### Fontos tudnivalók

Az alábbiakat vedd figyelembe a tesztelő használatakor:

- A tesztelő által adott eredmények csak tájékoztató jellegűek, melyektől a végleges értékelés pozitív és negatív irányba is eltérhet.
- **Nem az a feladat, hogy addig futtasd a tesztelőt, amíg minden át nem megy, hanem az, hogy a dolgozatot oldd meg a legjobb tudásod szerint! Ehhez a tesztelő csak egy segédlet, ami lehetőség szerint egy gyors visszajelzést ad a munkádról azáltal, hogy leteszteli a főbb eseteket, és ha azokon átmegy, akkor *valószínűleg* jó.**
- A tesztelőt igyekeztünk legjobb tudásunk és szándékunk szerint összeállítani, ennek ellenére elképzelhető, hogy egy hallgatónál valamilyen előre nem látott hiba miatt abszolút nem fut a tesztelő, vagy egyes részfeladatokat hibásan tesztel.
  - Ilyenkor megköszönjük, ha ezt jelzitek felénk, mivel így a jövőben elkerülhetővé tudunk tenni egy hibalehetőséget, illetve még a zh közben megpróbáljuk kijavítani a hibát is.
  - Fontos, ha ilyen történik, ne essetek kétségbe, hanem nyugodtan folytassátok a dolgozatot, hiszen azt az automata tesztelő nélkül, a gyakorlatokon tanult eszközökkel is meg kell tudni oldani! A feladat időkeretét is úgy szabjuk meg, hogy ebben az esetben is kényelmesen be lehet fejezni.
- Mivel a tesztelő csak egy segédlet, nem pedig a dolgozat kötelező része, ezért nem tudjuk elfogadni azt indoknak, hogy a zárthelyin a tesztelő miatt bármilyen hátrány ért!

## Automatikus zippelő, beadás

A zárthelyihez automatikus zippelőt biztosítunk, ami segít gyorsan és megfelelően kitölteni a nyilatkozatot, valamint összegyűjteni és becsomagolni a beadáshoz szükséges fájlokat.

A program először ellenőrzi, hogy létezik-e már szabályosan kitöltött `statement.txt`. Ha nem, akkor felkínálja a nyilatkozatot elfogadásra, majd segít azt kitölteni. Ha a nyilatkozatfájl érvényes, akkor ezt a részt onnantól átugorja. Végül becsomagolja a fájlokat:

![Zipper](https://i.imgur.com/EPTy6GW.png)

Az alábbiakat vedd figyelembe a zippelő használatakor, illetve a beadásnál:

- A zippelőt igyekeztünk legjobb tudásunk és szándékunk szerint összeállítani, többszörösen teszteltük, ennek ellenére fontos, hogy beadás előtt nyisd meg a zip fájlt és ellenőrizd, hogy minden benne van-e, amin dolgoztál és amit be szeretnél adni! Ezt akkor is tedd meg, ha nem a mi zippelőnket használod, hiszen egy váratlan hiba bármikor történhet!
- A dolgozat megfelelő és hiánytalan beadása a hallgató felelőssége. Erre mindig időben fel is szoktuk hívni a figyelmet, illetve a dolgozat végén külön 15 perces időkeretet adunk a feladat megfelelő, nyugodt körülmények közötti beadására. Ebből kifolyólag ilyen ügyben nem tudunk utólagos reklamációknak helyt adni. Tehát ha valaki a zh után jelzi, hogy egy fájlt nem adott be, akkor azt sajnos nem tudjuk elfogadni.

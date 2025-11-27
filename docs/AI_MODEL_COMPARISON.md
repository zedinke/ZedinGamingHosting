# AI Modell Összehasonlítás és Választás

Ez a dokumentum segít kiválasztani a legmegfelelőbb AI modellt a hosting platformhoz.

## 🎯 Alapértelmezett Modell: phi3:mini

A rendszer alapértelmezett modellje a **phi3:mini**, amely a legjobb egyensúlyt nyújtja a teljesítmény, sebesség és erőforrásigény között.

### Előnyök
- ✅ **Kis méret**: Csak ~2.3GB RAM
- ✅ **Gyors**: 2-3x gyorsabb válaszidő, mint a nagyobb modellek
- ✅ **Jó minőség**: 3.8B paraméter, még mindig kiváló válaszokat ad
- ✅ **Magyar nyelv**: Jól működik magyar nyelven
- ✅ **Alacsony erőforrásigény**: Alacsony CPU és RAM használat

## 📊 Modell Összehasonlítás

### Kicsi és Gyors Modellek (Ajánlott)

#### 1. phi3:mini ⭐ **AJÁNLOTT**
```bash
ollama pull phi3:mini
```
- **Méret**: 3.8B paraméter (~2.3GB)
- **RAM**: ~2.3GB
- **Sebesség**: ⚡⚡⚡ Nagyon gyors
- **Minőség**: ⭐⭐⭐⭐ Jó
- **Használat**: Általános chat, gyors válaszok
- **Előny**: Legjobb egyensúly sebesség és minőség között

#### 2. llama3.2:3b
```bash
ollama pull llama3.2:3b
```
- **Méret**: 3B paraméter (~2GB)
- **RAM**: ~2GB
- **Sebesség**: ⚡⚡⚡ Nagyon gyors
- **Minőség**: ⭐⭐⭐⭐ Jó
- **Használat**: Alternatíva a phi3:mini-hez

#### 3. tinyllama
```bash
ollama pull tinyllama
```
- **Méret**: 1.1B paraméter (~700MB)
- **RAM**: ~700MB
- **Sebesség**: ⚡⚡⚡⚡ Extrém gyors
- **Minőség**: ⭐⭐⭐ Közepes
- **Használat**: Nagyon korlátozott erőforrások esetén
- **Előny**: Legkisebb méret, leggyorsabb
- **Hátrány**: Alacsonyabb válasz minőség

### Közepes Modellek

#### 4. qwen2.5:3b
```bash
ollama pull qwen2.5:3b
```
- **Méret**: 3B paraméter (~2GB)
- **RAM**: ~2GB
- **Sebesség**: ⚡⚡⚡ Gyors
- **Minőség**: ⭐⭐⭐⭐ Jó
- **Használat**: Alternatíva, jó magyar nyelv támogatás

### Nagy Modellek (Csak ha van elég erőforrás)

#### 5. llama3
```bash
ollama pull llama3
```
- **Méret**: 8B paraméter (~8GB)
- **RAM**: ~8GB
- **Sebesség**: ⚡ Lassabb
- **Minőség**: ⭐⭐⭐⭐⭐ Kiváló
- **Használat**: Ha prioritás a minőség és van elég RAM
- **Előny**: Legjobb válasz minőség
- **Hátrány**: Nagy erőforrásigény, lassabb

#### 6. mistral
```bash
ollama pull mistral
```
- **Méret**: 7B paraméter (~7GB)
- **RAM**: ~7GB
- **Sebesség**: ⚡ Lassabb
- **Minőség**: ⭐⭐⭐⭐⭐ Kiváló
- **Használat**: Alternatíva a llama3-hoz

## 🎯 Választási Útmutató

### Kicsi szerver (2-4GB RAM)
```bash
ollama pull phi3:mini  # vagy
ollama pull llama3.2:3b
```
**Ajánlás**: `phi3:mini` - legjobb egyensúly

### Közepes szerver (4-8GB RAM)
```bash
ollama pull phi3:mini  # vagy
ollama pull qwen2.5:3b
```
**Ajánlás**: `phi3:mini` - még mindig a legjobb választás

### Nagy szerver (8GB+ RAM)
```bash
ollama pull phi3:mini  # alapértelmezett, vagy
ollama pull llama3     # ha prioritás a minőség
```
**Ajánlás**: `phi3:mini` - gyorsabb és elég jó minőség, vagy `llama3` ha a minőség fontosabb

### Extrém korlátozott erőforrás (<2GB RAM)
```bash
ollama pull tinyllama
```
**Ajánlás**: `tinyllama` - csak akkor, ha nincs más lehetőség

## ⚙️ Modell Választása

A modellt a `.env` fájlban lehet beállítani:

```env
OLLAMA_MODEL=phi3:mini  # Alapértelmezett
# vagy
OLLAMA_MODEL=llama3.2:3b
# vagy
OLLAMA_MODEL=llama3
```

## 📈 Teljesítmény Mérések

### Válaszidő (átlagos)
- **phi3:mini**: ~1-2 másodperc
- **llama3.2:3b**: ~1-2 másodperc
- **tinyllama**: ~0.5-1 másodperc
- **llama3**: ~3-5 másodperc

### RAM Használat
- **phi3:mini**: ~2.3GB
- **llama3.2:3b**: ~2GB
- **tinyllama**: ~700MB
- **llama3**: ~8GB

### CPU Használat
- Kisebb modellek: Alacsonyabb CPU használat
- Nagyobb modellek: Magasabb CPU használat

## 🔄 Modell Váltás

Ha másik modellre szeretnél váltani:

1. Töltsd le az új modellt:
```bash
ollama pull llama3.2:3b
```

2. Frissítsd a `.env` fájlt:
```env
OLLAMA_MODEL=llama3.2:3b
```

3. Indítsd újra az alkalmazást:
```bash
pm2 restart zedingaming
# vagy
docker-compose restart app
```

## 💡 Ajánlások

### Production környezet
- **Ajánlott**: `phi3:mini`
- **Ok**: Legjobb egyensúly sebesség, minőség és erőforrásigény között

### Fejlesztési környezet
- **Ajánlott**: `phi3:mini` vagy `tinyllama`
- **Ok**: Gyorsabb fejlesztési ciklus

### Magas forgalmú környezet
- **Ajánlott**: `phi3:mini` vagy `llama3.2:3b`
- **Ok**: Gyors válaszidő, alacsony erőforrásigény

### Minőség prioritás
- **Ajánlott**: `llama3` vagy `mistral`
- **Ok**: Legjobb válasz minőség (ha van elég erőforrás)


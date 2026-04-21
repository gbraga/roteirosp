# SP com Amor 🗺

PWA de roteiro de viagem para São Paulo (22–26/04/2026) com controle de gastos, mapa interativo e suporte offline.

## Execução local

Requer um servidor HTTP (navegadores bloqueiam Service Workers em `file://`).

### Python (sem instalar nada)
```bash
cd roteiro-sp
python3 -m http.server 8080
```
Acesse: [http://localhost:8080](http://localhost:8080)

### Node.js
```bash
npx serve .
```

### VS Code
Instale a extensão **Live Server** e clique em "Go Live" no canto inferior direito.

---

## Deploy online (para usar no smartphone)

### Netlify Drop
1. Acesse [app.netlify.com/drop](https://app.netlify.com/drop)
2. Arraste a pasta `roteiro-sp/` para a tela
3. Copie a URL HTTPS gerada e abra no smartphone

### GitHub Pages
```bash
git remote add origin https://github.com/<usuario>/<repo>.git
git push -u origin master
```
Ative em **Settings → Pages → Source: main / root**.

---

## Instalar no smartphone

Após abrir a URL HTTPS:

- **Android (Chrome):** menu ⋮ → "Adicionar à tela inicial"
- **iOS (Safari):** botão compartilhar ⬆ → "Adicionar à Tela de Início"

O app funciona **offline** após a primeira abertura.

---

## Estrutura

```
roteiro-sp/
├── index.html        ← App principal (Vue 3)
├── manifest.json     ← Manifest PWA
├── sw.js             ← Service Worker (cache offline)
└── assets/
    ├── vue.global.prod.js
    ├── tailwind.js
    ├── leaflet.js / leaflet.css
    ├── icon.svg
    └── marker-icon*.png / marker-shadow.png
```

## Funcionalidades

| Aba | Descrição |
|---|---|
| **Roteiro** | Cards por dia com check-in, avaliação por estrelas e campo de gasto |
| **Timeline** | Visão cronológica de todos os 23 pontos |
| **Explorar** | Mapa Leaflet com marcadores (verde = concluído) |
| **Ganhos** | Gasto total, gráfico de barras diário e média por dia |
| **Info** | Dicas de transporte, reservas e uso do app |

Dados salvos automaticamente no `localStorage` do dispositivo.

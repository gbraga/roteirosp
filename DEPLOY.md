# Publicar no GitHub Pages

## Pré-requisitos

- Conta no [GitHub](https://github.com)
- Git instalado (`git --version` para verificar)

---

## Passo 1 — Criar o repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Preencha:
   - **Repository name:** `roteiro-sp` (ou qualquer nome)
   - **Visibility:** Public *(obrigatório para GitHub Pages gratuito)*
3. **Não** marque nenhuma opção de inicialização (README, .gitignore, etc.)
4. Clique em **Create repository**
5. Copie a URL exibida, ex: `https://github.com/seu-usuario/roteiro-sp.git`

---

## Passo 2 — Conectar o repositório local

```bash
cd roteiro-sp
git remote add origin https://github.com/seu-usuario/roteiro-sp.git
git branch -M main
```

---

## Passo 3 — Fazer o push

```bash
git push -u origin main
```

Se pedir senha, use um **Personal Access Token** (não a senha do GitHub):
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Clique em **Generate new token**
3. Marque o escopo `repo`
4. Use o token gerado como senha no terminal

---

## Passo 4 — Ativar o GitHub Pages

> ⚠️ **Importante:** a seção de configuração só aparece **depois do push do Passo 3**.
> Se o repositório estiver vazio, o GitHub exibe apenas o campo "Custom domain" (que pode ser ignorado).
> Faça o push primeiro e então volte a esta página.

1. No repositório, clique em **Settings**
2. No menu lateral, clique em **Pages**
3. Na seção **"Build and deployment"**, em **Source**, selecione:
   - Branch: `main`
   - Folder: `/ (root)`
4. Clique em **Save**

> O campo **"Custom domain"** é opcional — **deixe em branco**.
> Funciona normalmente com a URL gratuita do GitHub.

O GitHub exibirá a URL no formato:
```
https://seu-usuario.github.io/roteiro-sp/
```

> A URL fica disponível em ~1–2 minutos após a ativação.

---

## Passo 5 — Abrir no smartphone

1. Abra a URL `https://seu-usuario.github.io/roteiro-sp/` no navegador do smartphone
2. **Android (Chrome):** toque no menu ⋮ → "Adicionar à tela inicial"
3. **iOS (Safari):** toque no botão compartilhar ⬆ → "Adicionar à Tela de Início"

O ícone do app aparecerá na home screen. Após a primeira abertura, o app funciona offline.

---

## Atualizar o app após mudanças

```bash
git add -A
git commit -m "descricao da mudanca"
git push
```

O GitHub Pages republica automaticamente em ~1 minuto.

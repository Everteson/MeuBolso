# Guia de Rotas do Backend (Python)

Aqui estão as rotas que você precisará implementar no seu backend Python (Flask/FastAPI/Django) para conectar com este frontend.

## 1. Autenticação (Auth)
Essas rotas gerenciam o acesso da família.

- **POST** `/api/auth/login`
  - **Body:** `{ "email": "...", "password": "..." }`
  - **Retorno:** Token JWT ou Cookie de sessão + dados do usuário `{ "id": 1, "name": "...", "token": "..." }`
  
- **POST** `/api/auth/register` (Opcional se for só criar no banco direto)
  - **Body:** `{ "name": "...", "email": "...", "password": "..." }`

- **GET** `/api/auth/me`
  - **Header:** `Authorization: Bearer <token>`
  - **Retorno:** Dados do usuário atual (para persistir o login ao recarregar a página).

## 2. Transações
O CRUD principal do sistema.

- **GET** `/api/transactions`
  - **Query Params:** `?month=10&year=2023` (para filtrar por data no futuro)
  - **Retorno:** Lista de transações `[ { "id": 1, "description": "...", "amount": 100.0, ... } ]`

- **POST** `/api/transactions`
  - **Body:** `{ "description": "...", "amount": 100, "type": "EXPENSE", "category": "...", "date": "...", "isRecurring": false }`
  - **Retorno:** A transação criada com ID.

- **DELETE** `/api/transactions/<id>`
  - **Retorno:** 204 No Content ou 200 OK.

- **PUT** `/api/transactions/<id>` (Para edição)
  - **Body:** Dados atualizados.

- **POST** `/api/transactions/import`
  - **Body:** Form-data com arquivo `.csv`.
  - **Lógica:** O backend lê o CSV, processa as linhas e salva no banco.

## 3. Estatísticas (Dashboard)
Para evitar calcular tudo no frontend, o backend pode entregar os totais prontos.

- **GET** `/api/stats/dashboard`
  - **Query Params:** `?month=X&year=Y`
  - **Retorno:**
    ```json
    {
      "balance": 1500.00,
      "income": 5000.00,
      "expenses": 3500.00,
      "categoryData": [
        { "name": "Alimentação", "value": 500 },
        { "name": "Contas", "value": 1000 }
      ],
      "monthlyTrend": [
        { "name": "Jan", "income": 4000, "expenses": 3000 }
      ]
    }
    ```

## Dicas para o Backend Python
1. **Banco de Dados:** Use SQLite para começar (já vem no Python).
2. **Framework:** Recomendo **FastAPI** pela velocidade e facilidade com JSON, ou **Flask** pela simplicidade.
3. **Segurança:** Use `bcrypt` para salvar as senhas da família (nunca texto puro).
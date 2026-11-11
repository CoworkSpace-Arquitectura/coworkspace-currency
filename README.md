# CoworkSpace · Currency Service

![CI-CD](https://github.com/CoworkSpace-Arquitectura/coworkspace-currency/actions/workflows/deploy.yml/badge.svg)

Microservicio de países y cambio de divisas. Consulta las tasas a ExchangeRate-API, las guarda en caché en Redis por 6 horas y conserva una copia en su base de datos por si el proveedor no responde.

- **Endpoints:** `/countries`, `/countries/:code`, `/rates?base=COP`, `/convert?amount=60000&from=COP&to=MXN`
- **Puerto local:** 3009
- Rates By Exchange Rate API (https://www.exchangerate-api.com)
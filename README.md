# MadVotes

Frontend for **MadVotes**, a governance prediction market on the Cosmos Hub. Browse markets tied to on-chain governance proposals, place bets on their outcomes, and claim winnings — all backed by a CosmWasm contract.

The app talks to the contract via the generated client in `src/codegen` (read path through `MadvotesQueryClient`, signing path through `MadvotesClient`).

## Installation & Dev Server

Install dependencies with `yarn` and spin up the dev server with `yarn start`.

## Running Tests

```bash
yarn test
```

## Deployment

Pushing to `main` automatically deploys to GitHub Pages. To deploy manually:

```bash
yarn deploy
```

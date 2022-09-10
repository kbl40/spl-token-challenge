import { initializeKeypair } from "./initializeKeypair"
import * as web3 from "@solana/web3.js"
import * as token from '@solana/spl-token'
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  findMetadataPda
} from '@metaplex-foundation/js'
import {
  DataV2, 
  createCreateMetadataAccountV2Instruction,
  createUpdateMetadataAccountV2Instruction
} from '@metaplex-foundation/mpl-token-metadata'
import * as fs from 'fs'

// Mint account helper function
async function createNewMint(
  connection: web3.Connection,
  payer: web3.Keypair,
  mintAuthority: web3.PublicKey,
  freezeAuthority: web3.PublicKey,
  decimals: number
) {
  const tokenMint = await token.createMint(
    connection,
    payer,
    mintAuthority,
    freezeAuthority,
    decimals
  )
}

async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"))
  const user = await initializeKeypair(connection)

  console.log("PublicKey:", user.publicKey.toBase58())

  /*
  Sample transaction with multiple instructions
  
  This creates a new Account and initializes it as a Mint Account
  const transaction = new Transaction.add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: keypair.publicKey,
      space: MINT_SIZE,
      lamports,
      programId,
    }),
    createInitializeMintInstruction(
      keypair.publicKey,
      decimals,
      mintAuthority,
      freezeAuthority,
      programId
    )
  )

  // Send the transaction
  await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, keypair],
    confirmOptions
  )

  return keypair.publicKey
  */
}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })

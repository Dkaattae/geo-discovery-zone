import { createHash } from "node:crypto";

/**
 * The bank's content pins, recorded once at one commit, for every test that
 * guards `question-bank/data/us-states/` (T-070, `engineering-decisions.md`
 * E-30). Only tests import this file.
 *
 * Each pin is the SHA-256 of a bank file **as it stood at `BANK_PINS_AT`**, the
 * default-branch commit T-070's branch starts from. A bank entity file is
 * hashed with exactly one thing removed: `sources.built_at`, which every
 * `bun run refresh` moves even when nothing else does (E-6). Nothing else is
 * stripped, reset or restored, so every field, `top_crops` included, is
 * pinned. `index.json` has no `built_at` and is hashed byte for byte.
 *
 * The SPARQL fixtures are deliberately not pinned here or anywhere: a refresh
 * re-records them.
 *
 * **A task that changes a bank file on purpose re-pins the values it moves**,
 * through a Test change request, and records the commit it re-pinned at. It
 * does not add an exception to `bankFileDigest`.
 */
export const BANK_PINS_AT = "b0ee336";

const sha256 = (text: string): string => createHash("sha256").update(text).digest("hex");

/**
 * The content digest of one bank file. `name` is the file's basename;
 * `text` its committed bytes. For a `us-state-*.json` file, the JSON is parsed,
 * `sources.built_at` is deleted, and the rest is re-serialised in its own key
 * order before hashing. It throws if the file has no `sources.built_at`, so the
 * one removal can never silently become a no-op.
 */
export function bankFileDigest(name: string, text: string): string {
  if (name === "index.json") return sha256(text);
  const entity = JSON.parse(text) as { sources?: { built_at?: unknown } };
  if (entity.sources === undefined || !("built_at" in entity.sources)) {
    throw new Error(`${name}: no sources.built_at to remove`);
  }
  delete entity.sources.built_at;
  return sha256(JSON.stringify(entity));
}

/**
 * `bankFileDigest` of all 51 bank files (`index.json` and the 50
 * `us-state-*.json`), computed from `git show b0ee336:question-bank/data/us-states/<name>`.
 */
export const BANK_DIGESTS: Readonly<Record<string, string>> = {
  "index.json": "cd6822166faad67383db4d0506bcc1a833e142884e1792b03292795ce3e1e066",
  "us-state-ak.json": "f99de7a4afc9361b249bf6a3fc5613901382789d2b3bf727458184e602acc41d",
  "us-state-al.json": "21948763be32ede065fb6777a8daf0010940d11eead706ad146ea927656251c6",
  "us-state-ar.json": "7e16b4a5cea9194b7341adb9fe02e17f083efb0ca67c212b2745ed8ff37cf560",
  "us-state-az.json": "b70e5c0175d44e30546669d734f7ce5dd22af56510c002a981cafbf127624dfe",
  "us-state-ca.json": "32c9ce6dc52541c5a47b3403228c1d108eea5870547bf116d3ed877b897a3dcf",
  "us-state-co.json": "4d3ff789762efad8016b749f9768f1fa169a424b367bc2fd1c2b9cacc2ceafaa",
  "us-state-ct.json": "e1bd185967355e49f1da9d553a389d1e38c0b6d8d5effbe88f23ffc2a45f39d9",
  "us-state-de.json": "b64477cddaca2b5052e747811284583b8c90ed9000ceb7925676e969b4db83d0",
  "us-state-fl.json": "a5f078a0158700c227e569af001ac1672a981c5d38bc1e96304be09f08a62dff",
  "us-state-ga.json": "c51508d459cba9dea3748de04358516a32ca861790383fc30a90b2e1d6ee96ac",
  "us-state-hi.json": "78c9f10cedaa3a7385f941b32336ff0c3717fee671115bf4b2af99f4dfaa843f",
  "us-state-ia.json": "4b73a086e46012f113d5807565cb24c5ec02d55a07fdfedd5b9bb8bee550f520",
  "us-state-id.json": "0bf18540dbc2da9369d881baaea2441a70a06fd1e67ed0c802f996f529a31342",
  "us-state-il.json": "300ff01e3ae4c97ed751b2ececde21a913f5aa3913af03404013fcb1a5d1c629",
  "us-state-in.json": "7575e4f9062c688e6896b5c59303b74dcc8e81d537b3ee4e1ebc852436ccbfb4",
  "us-state-ks.json": "69d185f0ef7c74570bafdca1cb2d19db101322a373d3aa272ad0796485a134de",
  "us-state-ky.json": "f91222d36e45d15df48a8337e96b2ee6dd68fa6071e4eb56204edf17e5943e0c",
  "us-state-la.json": "e52d8e98d14b77845fe9cdee11107207e7494fef92e13c9704b6813ca04f3ef9",
  "us-state-ma.json": "18a41f5ffa23ca0bc150723d13991cf6f2e67b6284c429579bab656ba372dfc7",
  "us-state-md.json": "725b347f03f06d1b67c5f7dbf3429a8eff59b44a42a7a4d2cee8f9e12978cc2e",
  "us-state-me.json": "a470203fc75d29cfa8e0cc9798c93354a848299ffa88795756658826cc47c546",
  "us-state-mi.json": "1c22374103111f45b3e62993c1b7d12fd5f5ed540e525c6fbacf2e59ca998e13",
  "us-state-mn.json": "80199e719d0d58c61c2b4c18b805ccbbc0a934dfc39de13827e518198e73ae1b",
  "us-state-mo.json": "8b5045b1e9f00a349f4c1d3cb6e2ad4824741a9ea3b812b165d0f97f77c93ec7",
  "us-state-ms.json": "89a30ee17c5bf0842ffd63772640fe03100a5e73bd718925f705b3c56a7e0802",
  "us-state-mt.json": "98abe89b7a2219427f7e5585bc74b269425da03216804ef80e1c0bdb3ae4541d",
  "us-state-nc.json": "e6c5963107371d2b64e8c142d49200ce9bc97272d26c5fc3ee6de15c56f2d85c",
  "us-state-nd.json": "4730e431ad93d4e38bbdd6434a99414888528ebedd17d5636712048f8bd01ceb",
  "us-state-ne.json": "b80fdcaa79ff81adddfc7e3476fd27efd91e2e68ac37de7bb993a1e29db08870",
  "us-state-nh.json": "c6c682ec8e755689c42e4fc4eeda564051b805551111cfa5eee140bf21691113",
  "us-state-nj.json": "7f0c6014bad6af9aae1b6f1001d1826f04fa1d56c7b70f59c386cf6f863fce5f",
  "us-state-nm.json": "7569831e1fed470f51310c9f710583e82ea5afdbca771d3452b575eaaf2beee8",
  "us-state-nv.json": "35b8f4e6a4718208e3477200ed11b284b679534719a15d17cf2c2c18a507a083",
  "us-state-ny.json": "30ce0653e1326a504c179a2505931f800ef1e0aeb17e00b4e9c14a475713ad71",
  "us-state-oh.json": "1ffa0e4b698e5d1c8c150712c0a2ae4345c3573b114d373cca1acced1d6ab1e8",
  "us-state-ok.json": "d41e28db708e736c5cbff744c3fb046a42de294dd00adf06e1194d21c4914321",
  "us-state-or.json": "d573e53b7230b371691ec38f3bc61507b68fdb26ad7b14db3381480b07e7a12f",
  "us-state-pa.json": "05ce59af6a5b650e306cb2fd15f8c48361c7ce01222cfff6327c7d65cc749e1f",
  "us-state-ri.json": "ef3d00045b67cb2bdbea90da9ef4450d340303ba295f2a174da946631e2bbd4f",
  "us-state-sc.json": "21e1a0826dfa8e53634b7ca219c5332aa625f1b5128ee46a0f622fa4c7a7064b",
  "us-state-sd.json": "35ad1d23bca15a003f24563858f0f5349dce0add8170e1d0ffcb31e89b264222",
  "us-state-tn.json": "820445df502e45de01b7f7cd9d2b216da250b911c4d4c8cfccf342bd03dd856c",
  "us-state-tx.json": "bdbf0986406c7c66fd3f8ea2ecc02a05513f095fb8efec94bcae0df498e5c895",
  "us-state-ut.json": "dd52235d82eb01d0af79f5a4af8de6708bd0a3aaab8303d05f1899c67eef540c",
  "us-state-va.json": "5179644f6f1a055d2ba9dfa574174c4d0858c25a5f5f5e04fbe35cdbd8e4c0f3",
  "us-state-vt.json": "47d8d9ae3c4d1a10a0a8b396fa490a1603317f45b0665e4ee39400f88e126530",
  "us-state-wa.json": "4772ce64131599d60dc1ee95162be3e7bbac093bd04c3d8ad86494e90a3830a8",
  "us-state-wi.json": "9e54ff788c9c93fe3ca685f83df663d8894c398215c38f3aa645c709eacf6fda",
  "us-state-wv.json": "0e24f61c2224d44f6467e18514a7ba29d46128afd34c52f80f63b20b5b6953d1",
  "us-state-wy.json": "d7d25493574660e999cb1c5b9f55d361e08a3ebb7858df2556775c2b9ae12e48",
};

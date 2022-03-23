// Feldman Verifiable Secret Sharing
// Currently only supports sharing an integer, not practical as it cannot split strings
// WARNING: This is a minimum working version, and is not cryptographically secure!

const crypto = require("crypto");
const math = require("mathjs");

async function share(n, t, s) {
  return new Promise(async (resolve, reject) => {
    try {
      // Pick primes Q, P such that Q | P - 1 (ie. P = r * Q + 1 for some r)
      const Q = await generatePrime();
      let r = 1,
        P = 0;
      let found = false;
      while (!found) {
        P = r * Q + 1;
        if (await isPrime(P)) {
          found = true;
        } else {
          r++;
        }
      }
      console.log(`P = ${P}`);
      console.log(`Q = ${Q}`);
      // Compute list of elements Zp*
      const ZPStar = generateZPStar(P);
      console.log(`ZPStar.length = ${ZPStar.length}`);
      // Compute list of elements G such that G = {h^r % P for h in Zp*}
      const G = generateG(ZPStar, r, P);
      console.log(`G.length = ${G.length}`);
      // Pick random element g in G that is not equal to 1
      let g = 1;
      while (g == 1) {
        g = randomElementInArray(G);
      }
      // Generate polynomial coefficients
      const coefficients = generatePolynomialCoefficients(Q, s, t);
      console.log(`Coefficients = ${coefficients}`);
      const polynomial = generatePolynomialFuncton(coefficients);
      // Generate shares
      const shares = generateShares(n, Q, polynomial);
      // Generate commitments
      const commitments = generateCommitments(g, P, coefficients);
      // Get share verification for first share
      const verification = shareVerfication(0, g, coefficients, P);
      resolve({
        commitments,
        shares,
        verification,
      });
    } catch (err) {
      reject(err);
    }
  });
}
async function generatePrime() {
  return new Promise((resolve, reject) => {
    crypto.generatePrime(8, { bigint: true }, (err, prime) => {
      if (err) {
        reject(err);
      } else {
        resolve(Number(prime));
      }
    });
  });
}

async function isPrime(n) {
  return new Promise((resolve, reject) => {
    crypto.checkPrime(BigInt(n), (err, isPrime) => {
      if (err) {
        reject(err);
      } else {
        resolve(isPrime);
      }
    });
  });
}

function generateZPStar(P) {
  let ZPStar = [];
  for (let i = 0; i < P; i++) {
    if (math.gcd(i, P) == 1) {
      ZPStar.push(i);
    }
  }
  return ZPStar;
}

function generateG(ZPStar, r, P) {
  let G = [];
  for (let i = 0; i < ZPStar.length; i++) {
    G.push(math.pow(ZPStar[i], r) % P);
  }
  // filter out duplicates
  G = G.filter((item, pos) => G.indexOf(item) == pos);
  return G;
}

function generatePolynomialCoefficients(Q, s, t) {
  let coefficients = [s]; // f(0) must be equal to s
  for (let i = 1; i <= t; i++) {
    coefficients.push(crypto.randomInt(1, Q));
  }
  return coefficients;
}

function generatePolynomialFuncton(coefficients) {
  const polynomial = (x) => {
    let result = coefficients[0];
    for (let i = 1; i < coefficients.length; i++) {
      result += coefficients[i] * Math.pow(x, i);
    }
    return result;
  };
  return polynomial;
}

function generateShares(n, Q, polynomial) {
  let shares = [];
  for (let i = 0; i < n; i++) {
    shares.push(polynomial(i) % Q);
  }
  return shares;
}

function generateCommitments(g, P, coefficients) {
  let commitments = [];
  for (let i = 0; i < coefficients.length; i++) {
      console.log(Math.pow(g, coefficients[i]));
    commitments.push(Math.pow(g, coefficients[i]) % P);
  }
  return commitments;
}

function shareVerfication(i, g, coefficients, P) {
  let verification = math.pow(g, coefficients[0]);
  for (let j = 1; j < coefficients.length; j++) {
    verification =
      (verification * Math.pow(Math.pow(share, coefficients[j])),
      Math.pow(i, j));
  }
  return verification % P;
}

function randomElementInArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

module.exports = {
  share,
};

# Security policy

This policy covers the **ceybyte.com website** in this repository. For the CB POS desktop app, see the policy in [`ceybyte/cbpos-releases`](https://github.com/ceybyte/cbpos-releases).

## Reporting a vulnerability

Please **don't** open a public issue, pull request or discussion for a security problem.

Report it privately through GitHub: **Security → Report a vulnerability** on this repository. Include:

- what you found and where (URL, endpoint or file)
- steps to reproduce, or a proof of concept
- the impact you expect (data exposed, account takeover, etc.)

We aim to acknowledge reports within **48 hours**, assess them within **7 days**, and fix critical issues within **14 days**. We'll credit you in the fix notes unless you ask us not to.

## Scope

In scope:
- `ceybyte.com`, `cdn.ceybyte.com`, `s3.ceybyte.com` and their APIs
- the code and configuration in this repository

Out of scope:
- denial-of-service and volumetric testing
- social engineering of maintainers or users
- findings that need a compromised device or browser
- reports from automated scanners without a demonstrated impact

## Data we especially protect

Shop owners' phone numbers, WhatsApp numbers and names must never be exposed by any public endpoint, page or cache. If you find any path that leaks them, treat it as critical.

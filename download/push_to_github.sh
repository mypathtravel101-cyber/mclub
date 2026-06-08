#!/bin/bash
# Push MCLUB_FX_Risk_Modelling_Service.docx to GitHub
# Usage: bash push_to_github.sh [GITHUB_TOKEN]

TOKEN=${1:-$GITHUB_TOKEN}
if [ -z "$TOKEN" ]; then
  echo "Error: No GitHub token provided."
  echo "Usage: bash push_to_github.sh ghp_your_token_here"
  echo "Or set GITHUB_TOKEN environment variable."
  exit 1
fi

REPO="mypathtravel101-cyber/mclub"
FILE="MCLUB_FX_Risk_Modelling_Service.docx"
B64=$(base64 -i "$FILE")

curl -X PUT \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO/contents/$FILE" \
  -d "{\"message\":\"docs: add MCLUB FX Risk Modelling Service proposal document\",\"content\":\"$B64\",\"branch\":\"main\"}"

echo ""
echo "Done! File pushed to https://github.com/$REPO/blob/main/$FILE"

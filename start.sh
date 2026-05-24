#!/bin/bash
cd "$(dirname "$0")"
exec node node_modules/next/dist/bin/next start -p 3000

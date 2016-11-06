#!/bin/sh

echo "Stress Loading Memory"
stress -m 1 --vm-bytes 256M -t 5s
echo "Stress complete"
sudo sysctl -w vm.drop_caches=3

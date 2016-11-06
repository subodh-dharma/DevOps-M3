#!/bin/bash

echo "Freeing Up Memory"
sudo sysctl -w vm.drop_cache=3

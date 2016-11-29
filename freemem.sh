#!/bin/bash

echo "Freeing Up Memory"
sudo sysctl -w vm.drop_caches=3
sudo rm -rf /tmp/*

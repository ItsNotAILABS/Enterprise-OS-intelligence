"""
test_sovereign_450b_loader.py — Tests for deterministic 450B loader utilities
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from sovereign_450b_loader import (
    ChipShardMap,
    MAX_CHIPS,
    MERA_SIZE_GB,
    MERATensorDescriptor,
    N_LAYERS_450B,
    VirtualSiliconLayout,
)


def test_mera_tensor_descriptor_param_count():
    d = MERATensorDescriptor(
        name="t",
        layer_idx=0,
        scale=0,
        tensor_type="isometry",
        shape=(2, 3, 4),
        bond_dim=8,
    )
    assert d.n_params == 24


def test_virtual_silicon_layout_compute_layout_is_consistent():
    layout = VirtualSiliconLayout()
    layout.compute_layout()
    assert layout.weight_region_gb == MERA_SIZE_GB
    assert layout.kv_cache_gb == 2.0
    assert layout.activation_gb == 0.5
    assert layout.quantum_state_gb == 0.01
    assert layout.total_memory_gb == (
        layout.weight_region_gb + layout.kv_cache_gb + layout.activation_gb + layout.quantum_state_gb
    )


def test_chip_shard_map_compute_sharding_partitions_layers_evenly():
    shard_map = ChipShardMap(n_chips=MAX_CHIPS)
    shard_map.compute_sharding()

    assert len(shard_map.chip_layers) == MAX_CHIPS
    assert shard_map.layers_per_chip * MAX_CHIPS == N_LAYERS_450B

    all_layers = []
    for chip_id in range(MAX_CHIPS):
        layers = shard_map.chip_layers[chip_id]
        assert len(layers) == shard_map.layers_per_chip
        all_layers.extend(layers)
        assert shard_map.chip_memory_gb[chip_id] == MERA_SIZE_GB / MAX_CHIPS

    assert sorted(all_layers) == list(range(N_LAYERS_450B))


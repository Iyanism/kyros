from __future__ import annotations


def quantity_to_mt(quantity: float) -> float:
    return round(quantity / 1000.0, 4)

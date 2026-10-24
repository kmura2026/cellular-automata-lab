import pytest

from cellular_automata_lab import run, step


def test_rule_90_single_cell_makes_sierpinski_row():
    assert step([0, 0, 1, 0, 0], 90) == [0, 1, 0, 1, 0]


def test_rule_0_clears_everything():
    assert step([1, 1, 0, 1], 0) == [0, 0, 0, 0]


def test_wraps_around_edges():
    # Rule 2 copies the right neighbour into a cell whose left and self are 0.
    assert step([1, 0, 0, 0], 2) == [0, 0, 0, 1]


def test_run_returns_initial_plus_generations():
    history = run([0, 1, 0], 30, 3)
    assert len(history) == 4
    assert history[0] == [0, 1, 0]


@pytest.mark.parametrize("rule", [-1, 256])
def test_invalid_rule(rule):
    with pytest.raises(ValueError):
        step([0, 1, 0], rule)


def test_negative_generations():
    with pytest.raises(ValueError):
        run([0, 1, 0], 30, -1)

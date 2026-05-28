"""
Unit tests for utils/balance_calculator.py
Run with: python -m pytest tests/ or python manage.py test tests
All tests use plain dicts — no database required.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import unittest
from utils.balance_calculator import calculate_balances


class TestBalanceCalculator(unittest.TestCase):

    # ------------------------------------------------------------------ #
    # Test 1: Single expense, 2 members — payer is owed half from other   #
    # ------------------------------------------------------------------ #
    def test_single_expense_two_members(self):
        expenses = [{
            "payer_id": "alice",
            "participant_ids": ["alice", "bob"],
            "amount": 100.0,
        }]
        settlements = []
        result = calculate_balances(expenses, settlements)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["from_user_id"], "bob")
        self.assertEqual(result[0]["to_user_id"], "alice")
        self.assertAlmostEqual(result[0]["amount"], 50.0, places=2)

    # ------------------------------------------------------------------ #
    # Test 2: Multiple expenses, same payer                               #
    # ------------------------------------------------------------------ #
    def test_multiple_expenses_same_payer(self):
        expenses = [
            {"payer_id": "alice", "participant_ids": ["alice", "bob"], "amount": 60.0},
            {"payer_id": "alice", "participant_ids": ["alice", "bob"], "amount": 40.0},
        ]
        settlements = []
        result = calculate_balances(expenses, settlements)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["from_user_id"], "bob")
        self.assertEqual(result[0]["to_user_id"], "alice")
        self.assertAlmostEqual(result[0]["amount"], 50.0, places=2)  # (60+40) / 2

    # ------------------------------------------------------------------ #
    # Test 3: Multiple payers — distinct pairs                            #
    # ------------------------------------------------------------------ #
    def test_multiple_payers(self):
        expenses = [
            {"payer_id": "alice", "participant_ids": ["alice", "bob"], "amount": 100.0},
            {"payer_id": "bob", "participant_ids": ["alice", "bob"], "amount": 60.0},
        ]
        settlements = []
        result = calculate_balances(expenses, settlements)

        # Alice paid 100 → bob owes 50
        # Bob paid 60 → alice owes 30
        # Net: bob owes alice 20
        amounts = {(r["from_user_id"], r["to_user_id"]): r["amount"] for r in result}
        self.assertIn(("bob", "alice"), amounts)
        self.assertAlmostEqual(amounts[("bob", "alice")], 20.0, places=2)
        self.assertNotIn(("alice", "bob"), amounts)

    # ------------------------------------------------------------------ #
    # Test 4: Partial settlement — balance reduced correctly              #
    # ------------------------------------------------------------------ #
    def test_partial_settlement(self):
        expenses = [{"payer_id": "alice", "participant_ids": ["alice", "bob"], "amount": 100.0}]
        settlements = [{"payer_id": "bob", "payee_id": "alice", "amount": 20.0}]
        result = calculate_balances(expenses, settlements)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["from_user_id"], "bob")
        self.assertEqual(result[0]["to_user_id"], "alice")
        self.assertAlmostEqual(result[0]["amount"], 30.0, places=2)  # 50 - 20

    # ------------------------------------------------------------------ #
    # Test 5: Full settlement — balance reaches zero                      #
    # ------------------------------------------------------------------ #
    def test_full_settlement_clears_balance(self):
        expenses = [{"payer_id": "alice", "participant_ids": ["alice", "bob"], "amount": 100.0}]
        settlements = [{"payer_id": "bob", "payee_id": "alice", "amount": 50.0}]
        result = calculate_balances(expenses, settlements)

        self.assertEqual(result, [])  # All settled up

    # ------------------------------------------------------------------ #
    # Test 6: Over-settlement — direction flips correctly                 #
    # ------------------------------------------------------------------ #
    def test_over_settlement_flips_direction(self):
        expenses = [{"payer_id": "alice", "participant_ids": ["alice", "bob"], "amount": 100.0}]
        # Bob owed 50, but pays 80 — overpays by 30
        settlements = [{"payer_id": "bob", "payee_id": "alice", "amount": 80.0}]
        result = calculate_balances(expenses, settlements)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["from_user_id"], "alice")
        self.assertEqual(result[0]["to_user_id"], "bob")
        self.assertAlmostEqual(result[0]["amount"], 30.0, places=2)

    # ------------------------------------------------------------------ #
    # Test 7: Three-way group — all pairwise balances correct             #
    # ------------------------------------------------------------------ #
    def test_three_way_group(self):
        expenses = [
            # Alice pays 90 for all three → carol and bob each owe 30 to alice
            {"payer_id": "alice", "participant_ids": ["alice", "bob", "carol"], "amount": 90.0},
            # Bob pays 60 for all three → alice and carol each owe 20 to bob
            {"payer_id": "bob", "participant_ids": ["alice", "bob", "carol"], "amount": 60.0},
        ]
        settlements = []
        result = calculate_balances(expenses, settlements)

        # Expected:
        # bob owes alice 30, then alice owes bob 20 → net bob owes alice 10
        # carol owes alice 30, carol owes bob 20
        amounts = {(r["from_user_id"], r["to_user_id"]): r["amount"] for r in result}

        self.assertAlmostEqual(amounts.get(("bob", "alice"), 0), 10.0, places=2)
        self.assertAlmostEqual(amounts.get(("carol", "alice"), 0), 30.0, places=2)
        self.assertAlmostEqual(amounts.get(("carol", "bob"), 0), 20.0, places=2)
        # No reverse directions should exist
        self.assertNotIn(("alice", "bob"), amounts)


if __name__ == "__main__":
    unittest.main()

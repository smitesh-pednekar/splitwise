"""
Balance calculator utility.
Pure function — no Django/DB imports. Takes plain dicts, returns plain dicts.
This makes it easily unit-testable without a database.
"""

from collections import defaultdict


def calculate_balances(expenses: list, settlements: list) -> list:
    """
    Compute raw pairwise net balances from a list of expenses and settlements.

    Args:
        expenses: list of dicts with keys:
            - payer_id (str)
            - participant_ids (list of str)
            - amount (float)
        settlements: list of dicts with keys:
            - payer_id (str)   — the person paying off debt
            - payee_id (str)   — the person being paid
            - amount (float)

    Returns:
        list of dicts: [{ "from_user_id": str, "to_user_id": str, "amount": float }]
        Only includes pairs where the net amount > 0.01 (filters floating-point noise).
    """
    # owed[debtor_id][creditor_id] = amount debtor owes creditor
    owed = defaultdict(lambda: defaultdict(float))

    # Process expenses
    for expense in expenses:
        payer_id = str(expense["payer_id"])
        participants = [str(pid) for pid in expense["participant_ids"]]
        n = len(participants)
        if n == 0:
            continue
        share = float(expense["amount"]) / n

        for participant_id in participants:
            if participant_id != payer_id:
                owed[participant_id][payer_id] += share

    # Process settlements
    for settlement in settlements:
        payer_id = str(settlement["payer_id"])
        payee_id = str(settlement["payee_id"])
        amount = float(settlement["amount"])

        owed[payer_id][payee_id] -= amount

        # Handle overpayment — flip direction of excess
        if owed[payer_id][payee_id] < 0:
            excess = abs(owed[payer_id][payee_id])
            owed[payer_id][payee_id] = 0
            owed[payee_id][payer_id] += excess

    # Net opposite-direction debts between the same pair.
    # e.g. if owed[bob][alice]=50 and owed[alice][bob]=30, net is bob owes alice 20.
    seen_pairs = set()
    result = []

    all_debtors = list(owed.keys())
    for debtor_id in all_debtors:
        for creditor_id in list(owed[debtor_id].keys()):
            if (debtor_id, creditor_id) in seen_pairs or (creditor_id, debtor_id) in seen_pairs:
                continue
            seen_pairs.add((debtor_id, creditor_id))

            forward = owed[debtor_id][creditor_id]    # debtor owes creditor
            backward = owed[creditor_id][debtor_id]   # creditor owes debtor
            net = forward - backward

            if net > 0.01:
                result.append({
                    "from_user_id": debtor_id,
                    "to_user_id": creditor_id,
                    "amount": round(net, 2),
                })
            elif net < -0.01:
                result.append({
                    "from_user_id": creditor_id,
                    "to_user_id": debtor_id,
                    "amount": round(abs(net), 2),
                })

    return result

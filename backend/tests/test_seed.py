import importlib

import pytest
from pymongo.errors import BulkWriteError


def test_seed_chunks_bulk_writes_and_retries_cosmos_throttling(monkeypatch):
    seed = importlib.import_module('app.seed')
    calls = []
    delays = []

    class Collection:
        def bulk_write(self, operations):
            batch = list(operations)
            calls.append(batch)
            if len(calls) == 1:
                raise BulkWriteError({'writeErrors': [{'code': 16500, 'errmsg': 'RetryAfterMs=25'}]})

    monkeypatch.setattr(seed, 'sleep', delays.append)
    operations = list(range(21))
    seed._bulk_write_in_chunks(Collection(), operations, batch_size=10, pause_seconds=0.3)

    assert calls == [operations[:10], operations[:10], operations[10:20], operations[20:]]
    assert delays == [0.3, 0.3, 0.3]


def test_seed_does_not_retry_non_throttling_bulk_errors(monkeypatch):
    seed = importlib.import_module('app.seed')
    calls = []

    class Collection:
        def bulk_write(self, operations):
            calls.append(list(operations))
            raise BulkWriteError({'writeErrors': [{'code': 11000, 'errmsg': 'duplicate key'}]})

    monkeypatch.setattr(seed, 'sleep', lambda _delay: pytest.fail('unexpected retry delay'))
    with pytest.raises(BulkWriteError):
        seed._bulk_write_in_chunks(Collection(), [1, 2], batch_size=10)

    assert calls == [[1, 2]]

import unittest
from ..main import handler
import os


# [run test] python -m unittest crawling.tests.test_main

os.environ["STAGE"] = 'test'


class TestMyModule(unittest.TestCase):

    def test_crawling_handler(self):
        result = handler({
            "body": "{\"artistAccount\":\"younha_holic\",\"instagramAccount\":\"younha_holic\"}"
        })
        # Assert that the status code is 200
        self.assertEqual(result['statusCode'], 200)


if __name__ == '__main__':
    unittest.main()

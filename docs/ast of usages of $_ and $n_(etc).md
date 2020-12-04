# ast parser

`@babel/parser`

sourceType should set to "script" otherwise strict mode will be enabled and
the parse will fail due to the use of `with` in vue template render function

https://astexplorer.net/


# ast of $_ , i.e. single message

"arguments": [
  {
    "type": "CallExpression",
    "start": 2653,
    "end": 2663,
    "loc": {
      "start": {
        "line": 66,
        "column": 48
      },
      "end": {
        "line": 66,
        "column": 58
      }
    },
    "callee": {
      "type": "Identifier",
      "start": 2653,
      "end": 2655,
      "loc": {
        "start": {
          "line": 66,
          "column": 48
        },
        "end": {
          "line": 66,
          "column": 50
        },
        "identifierName": "$_"
      },
      "name": "$_"
    },
    "arguments": [
      {
        "type": "StringLiteral",
        "start": 2656,
        "end": 2662,
        "loc": {
          "start": {
            "line": 66,
            "column": 51
          },
          "end": {
            "line": 66,
            "column": 57
          }
        },
        "extra": {
          "rawValue": "Name",
          "raw": "\"Name\""
        },
        "value": "Name"
      }
    ]
  }
]


# ast of $p_, i.e. support contextual comment

"arguments": [
  {
    "type": "CallExpression",
    "start": 2688,
    "end": 2722,
    "loc": {
      "start": {
        "line": 66,
        "column": 83
      },
      "end": {
        "line": 66,
        "column": 117
      }
    },
    "callee": {
      "type": "Identifier",
      "start": 2688,
      "end": 2691,
      "loc": {
        "start": {
          "line": 66,
          "column": 83
        },
        "end": {
          "line": 66,
          "column": 86
        },
        "identifierName": "$p_"
      },
      "name": "$p_"
    },
    "arguments": [
      {
        "type": "StringLiteral",
        "start": 2692,
        "end": 2713,
        "loc": {
          "start": {
            "line": 66,
            "column": 87
          },
          "end": {
            "line": 66,
            "column": 108
          }
        },
        "extra": {
          "rawValue": "used for name label",
          "raw": "\"used for name label\""
        },
        "value": "used for name label"
      },
      {
        "type": "StringLiteral",
        "start": 2715,
        "end": 2721,
        "loc": {
          "start": {
            "line": 66,
            "column": 110
          },
          "end": {
            "line": 66,
            "column": 116
          }
        },
        "extra": {
          "rawValue": "Name",
          "raw": "\"Name\""
        },
        "value": "Name"
      }
    ]
  }
]


# ast of $n_, i.e. support plural

usage:

```vue
{{ $n_(singular, plural, number) }}
```


"arguments": [
  {
    "type": "CallExpression",
    "start": 2747,
    "end": 2770,
    "loc": {
      "start": {
        "line": 66,
        "column": 142
      },
      "end": {
        "line": 66,
        "column": 165
      }
    },
    "callee": {
      "type": "Identifier",
      "start": 2747,
      "end": 2750,
      "loc": {
        "start": {
          "line": 66,
          "column": 142
        },
        "end": {
          "line": 66,
          "column": 145
        },
        "identifierName": "$n_"
      },
      "name": "$n_"
    },
    "arguments": [
      {
        "type": "StringLiteral",
        "start": 2751,
        "end": 2757,
        "loc": {
          "start": {
            "line": 66,
            "column": 146
          },
          "end": {
            "line": 66,
            "column": 152
          }
        },
        "extra": {
          "rawValue": "Name",
          "raw": "\"Name\""
        },
        "value": "Name"
      },
      {
        "type": "StringLiteral",
        "start": 2759,
        "end": 2766,
        "loc": {
          "start": {
            "line": 66,
            "column": 154
          },
          "end": {
            "line": 66,
            "column": 161
          }
        },
        "extra": {
          "rawValue": "Names",
          "raw": "\"Names\""
        },
        "value": "Names"
      },
      {
        "type": "NumericLiteral",
        "start": 2768,
        "end": 2769,
        "loc": {
          "start": {
            "line": 66,
            "column": 163
          },
          "end": {
            "line": 66,
            "column": 164
          }
        },
        "extra": {
          "rawValue": 2,
          "raw": "2"
        },
        "value": 2
      }
    ]
  }
]


# ast of $np_, i.e. support both contextual comment and plural

usage:

```vue
{{ $np_(comment, singular, plural, number) }}
```

"arguments": [
  {
    "type": "CallExpression",
    "start": 2795,
    "end": 2842,
    "loc": {
      "start": {
        "line": 66,
        "column": 190
      },
      "end": {
        "line": 66,
        "column": 237
      }
    },
    "callee": {
      "type": "Identifier",
      "start": 2795,
      "end": 2799,
      "loc": {
        "start": {
          "line": 66,
          "column": 190
        },
        "end": {
          "line": 66,
          "column": 194
        },
        "identifierName": "$np_"
      },
      "name": "$np_"
    },
    "arguments": [
      {
        "type": "StringLiteral",
        "start": 2800,
        "end": 2821,
        "loc": {
          "start": {
            "line": 66,
            "column": 195
          },
          "end": {
            "line": 66,
            "column": 216
          }
        },
        "extra": {
          "rawValue": "used for name label",
          "raw": "\"used for name label\""
        },
        "value": "used for name label"
      },
      {
        "type": "StringLiteral",
        "start": 2823,
        "end": 2829,
        "loc": {
          "start": {
            "line": 66,
            "column": 218
          },
          "end": {
            "line": 66,
            "column": 224
          }
        },
        "extra": {
          "rawValue": "Name",
          "raw": "\"Name\""
        },
        "value": "Name"
      },
      {
        "type": "StringLiteral",
        "start": 2831,
        "end": 2838,
        "loc": {
          "start": {
            "line": 66,
            "column": 226
          },
          "end": {
            "line": 66,
            "column": 233
          }
        },
        "extra": {
          "rawValue": "Names",
          "raw": "\"Names\""
        },
        "value": "Names"
      },
      {
        "type": "NumericLiteral",
        "start": 2840,
        "end": 2841,
        "loc": {
          "start": {
            "line": 66,
            "column": 235
          },
          "end": {
            "line": 66,
            "column": 236
          }
        },
        "extra": {
          "rawValue": 2,
          "raw": "2"
        },
        "value": 2
      }
    ]
  }
]

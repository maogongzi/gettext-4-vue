# ast of $_

"value": {
  "type": "CallExpression",
  "start": 22534,
  "end": 22565,
  "loc": {
    "start": {
      "line": 960,
      "column": 21
    },
    "end": {
      "line": 960,
      "column": 52
    }
  },
  "callee": {
    "type": "MemberExpression",
    "start": 22534,
    "end": 22541,
    "loc": {
      "start": {
        "line": 960,
        "column": 21
      },
      "end": {
        "line": 960,
        "column": 28
      }
    },
    "object": {
      "type": "ThisExpression",
      "start": 22534,
      "end": 22538,
      "loc": {
        "start": {
          "line": 960,
          "column": 21
        },
        "end": {
          "line": 960,
          "column": 25
        }
      }
    },
    "computed": false,
    "property": {
      "type": "Identifier",
      "start": 22539,
      "end": 22541,
      "loc": {
        "start": {
          "line": 960,
          "column": 26
        },
        "end": {
          "line": 960,
          "column": 28
        },
        "identifierName": "$_"
      },
      "name": "$_"
    }
  },
  "arguments": [
    {
      "type": "StringLiteral",
      "start": 22542,
      "end": 22564,
      "loc": {
        "start": {
          "line": 960,
          "column": 29
        },
        "end": {
          "line": 960,
          "column": 51
        }
      },
      "extra": {
        "rawValue": "Discard Flow Changes",
        "raw": "\"Discard Flow Changes\""
      },
      "value": "Discard Flow Changes"
    }
  ]
}

# ast of $p_

"value": {
  "type": "CallExpression",
  "start": 22587,
  "end": 22690,
  "loc": {
    "start": {
      "line": 961,
      "column": 20
    },
    "end": {
      "line": 962,
      "column": 21
    }
  },
  "callee": {
    "type": "MemberExpression",
    "start": 22587,
    "end": 22595,
    "loc": {
      "start": {
        "line": 961,
        "column": 20
      },
      "end": {
        "line": 961,
        "column": 28
      }
    },
    "object": {
      "type": "ThisExpression",
      "start": 22587,
      "end": 22591,
      "loc": {
        "start": {
          "line": 961,
          "column": 20
        },
        "end": {
          "line": 961,
          "column": 24
        }
      }
    },
    "computed": false,
    "property": {
      "type": "Identifier",
      "start": 22592,
      "end": 22595,
      "loc": {
        "start": {
          "line": 961,
          "column": 25
        },
        "end": {
          "line": 961,
          "column": 28
        },
        "identifierName": "$p_"
      },
      "name": "$p_"
    }
  },
  "arguments": [
    {
      "type": "StringLiteral",
      "start": 22596,
      "end": 22613,
      "loc": {
        "start": {
          "line": 961,
          "column": 29
        },
        "end": {
          "line": 961,
          "column": 46
        }
      },
      "extra": {
        "rawValue": "confirm message",
        "raw": "\"confirm message\""
      },
      "value": "confirm message"
    },
    {
      "type": "TemplateLiteral",
      "start": 22615,
      "end": 22689,
      "loc": {
        "start": {
          "line": 961,
          "column": 48
        },
        "end": {
          "line": 962,
          "column": 20
        }
      },
      "expressions": [],
      "quasis": [
        {
          "type": "TemplateElement",
          "start": 22616,
          "end": 22688,
          "loc": {
            "start": {
              "line": 961,
              "column": 49
            },
            "end": {
              "line": 962,
              "column": 19
            }
          },
          "value": {
            "raw": "Are you sure you want to discard all changes made to\n          the flow?",
            "cooked": "Are you sure you want to discard all changes made to\n          the flow?"
          },
          "tail": true
        }
      ]
    }
  ]
}

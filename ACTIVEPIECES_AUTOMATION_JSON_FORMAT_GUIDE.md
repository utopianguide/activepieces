# Activepieces Automation JSON Format - Complete Guide

This comprehensive guide provides everything you need to know about the Activepieces automation JSON format. Use this as a reference when creating flows programmatically or when working with LLMs to generate Activepieces automations.

## Table of Contents

1. [Overview](#overview)
2. [Flow Structure](#flow-structure)
3. [Triggers](#triggers)
4. [Actions](#actions)
5. [Properties and Data Types](#properties-and-data-types)
6. [Connections and Authentication](#connections-and-authentication)
7. [Flow Control](#flow-control)
8. [Common Pieces Reference](#common-pieces-reference)
9. [Complete Flow Examples](#complete-flow-examples)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

## Overview

Activepieces flows are defined as JSON objects that describe the automation workflow. Each flow consists of:

- **Flow metadata**: Basic information about the flow
- **Flow version**: The actual workflow definition
- **Trigger**: What starts the flow
- **Actions**: What the flow does (connected in a chain)

### Key Concepts

- **Flow**: The container for an automation
- **FlowVersion**: The actual workflow definition with triggers and actions
- **Trigger**: The starting point of a flow (webhook, schedule, etc.)
- **Action**: A step in the workflow (API call, data transformation, etc.)
- **Piece**: A reusable component (like Slack, HTTP, etc.)
- **Connection**: Authentication credentials for external services

## Flow Structure

### Complete Flow JSON Structure

```json
{
  "id": "flow_id_here",
  "created": "2023-05-24T00:16:41.353Z",
  "updated": "2023-05-24T00:16:41.353Z",
  "projectId": "project_id_here",
  "externalId": "external_id_here",
  "folderId": null,
  "status": "ENABLED",
  "schedule": null,
  "handshakeConfiguration": null,
  "publishedVersionId": "version_id_here",
  "metadata": null,
  "version": {
    "id": "version_id_here",
    "created": "2023-05-24T00:16:41.353Z",
    "updated": "2023-05-24T00:16:41.353Z",
    "flowId": "flow_id_here",
    "displayName": "My Automation Flow",
    "updatedBy": "user_id_here",
    "valid": true,
    "schemaVersion": "5",
    "agentIds": [],
    "state": "DRAFT",
    "connectionIds": [],
    "trigger": {
      // Trigger definition here
    }
  }
}
```

### Flow Status Values

- `"ENABLED"`: Flow is active and will run
- `"DISABLED"`: Flow is inactive

### Flow Version State Values

- `"DRAFT"`: Flow is being edited
- `"LOCKED"`: Flow is published and locked

### Schema Version

Current schema version is `"5"`. Always use the latest version.

## Triggers

Triggers define how flows are started. There are two main types:

### Empty Trigger

Used for manual testing or as a placeholder:

```json
{
  "name": "trigger",
  "type": "EMPTY",
  "valid": true,
  "displayName": "Manual Trigger",
  "settings": {},
  "nextAction": null
}
```

### Piece Trigger

Uses a specific piece (like Schedule, Webhook, etc.):

```json
{
  "name": "trigger",
  "type": "PIECE_TRIGGER",
  "valid": true,
  "displayName": "Schedule Trigger",
  "settings": {
    "pieceName": "schedule",
    "pieceVersion": "0.0.2",
    "triggerName": "cron_expression",
    "input": {
      "cronExpression": "0 9 * * 1-5",
      "timezone": "UTC"
    },
    "inputUiInfo": {
      "customizedInputs": {},
      "lastTestDate": "2023-05-24T00:16:41.353Z"
    }
  },
  "nextAction": {
    // First action in the chain
  }
}
```

### Common Trigger Types

#### Schedule Triggers

**Cron Expression:**
```json
{
  "pieceName": "schedule",
  "pieceVersion": "0.0.2",
  "triggerName": "cron_expression",
  "input": {
    "cronExpression": "0 9 * * 1-5",
    "timezone": "UTC"
  }
}
```

**Every Hour:**
```json
{
  "pieceName": "schedule",
  "pieceVersion": "0.0.2",
  "triggerName": "every_hour",
  "input": {}
}
```

**Every Day:**
```json
{
  "pieceName": "schedule",
  "pieceVersion": "0.0.2",
  "triggerName": "every_day",
  "input": {
    "hour": 9,
    "minute": 0,
    "timezone": "UTC"
  }
}
```

#### Webhook Triggers

```json
{
  "pieceName": "webhook",
  "pieceVersion": "0.1.0",
  "triggerName": "catch_hook",
  "input": {}
}
```

#### Slack Triggers

**New Message:**
```json
{
  "pieceName": "slack",
  "pieceVersion": "0.2.1",
  "triggerName": "new_message",
  "input": {
    "authentication": "{{connections.slack}}",
    "channel": "C1234567890"
  }
}
```

## Actions

Actions are the steps that execute in your flow. They are chained together using the `nextAction` property.

### Action Types

1. **PIECE**: Uses a piece (like Slack, HTTP, etc.)
2. **CODE**: Custom JavaScript code
3. **LOOP_ON_ITEMS**: Iterates over a list
4. **ROUTER**: Conditional branching

### Basic Action Structure

```json
{
  "name": "step_1",
  "type": "PIECE",
  "valid": true,
  "displayName": "Send Slack Message",
  "skip": false,
  "settings": {
    "pieceName": "slack",
    "pieceVersion": "0.2.1",
    "actionName": "send_channel_message",
    "input": {
      "authentication": "{{connections.slack}}",
      "channel": "general",
      "text": "Hello World!"
    },
    "inputUiInfo": {
      "customizedInputs": {},
      "lastTestDate": "2023-05-24T00:16:41.353Z"
    },
    "errorHandlingOptions": {
      "continueOnFailure": {
        "value": false
      },
      "retryOnFailure": {
        "value": true
      }
    }
  },
  "nextAction": {
    // Next action in the chain
  }
}
```

### Piece Actions

#### HTTP Request

```json
{
  "name": "http_request",
  "type": "PIECE",
  "valid": true,
  "displayName": "HTTP Request",
  "settings": {
    "pieceName": "http",
    "pieceVersion": "0.20.3",
    "actionName": "send_request",
    "input": {
      "method": "POST",
      "url": "https://api.example.com/data",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer {{connections.api_token}}"
      },
      "queryParams": {},
      "authType": "BEARER_TOKEN",
      "authFields": {
        "token": "{{connections.api_token}}"
      },
      "body_type": "json",
      "body": {
        "data": {
          "message": "Hello from Activepieces",
          "timestamp": "{{trigger.timestamp}}"
        }
      }
    },
    "inputUiInfo": {
      "customizedInputs": {}
    },
    "errorHandlingOptions": {
      "continueOnFailure": {
        "value": false
      },
      "retryOnFailure": {
        "value": true
      }
    }
  }
}
```

#### Slack Actions

**Send Message to Channel:**
```json
{
  "name": "slack_message",
  "type": "PIECE",
  "valid": true,
  "displayName": "Send Slack Message",
  "settings": {
    "pieceName": "slack",
    "pieceVersion": "0.2.1",
    "actionName": "send_channel_message",
    "input": {
      "authentication": "{{connections.slack}}",
      "channel": "general",
      "text": "Alert: {{trigger.body.message}}",
      "username": "Activepieces Bot",
      "profilePicture": "https://cdn.activepieces.com/pieces/slack.png"
    },
    "inputUiInfo": {
      "customizedInputs": {}
    }
  }
}
```

**Send Direct Message:**
```json
{
  "name": "slack_dm",
  "type": "PIECE",
  "valid": true,
  "displayName": "Send Direct Message",
  "settings": {
    "pieceName": "slack",
    "pieceVersion": "0.2.1",
    "actionName": "send_direct_message",
    "input": {
      "authentication": "{{connections.slack}}",
      "userId": "U1234567890",
      "text": "Private message: {{trigger.body.message}}"
    },
    "inputUiInfo": {
      "customizedInputs": {}
    }
  }
}
```

#### Google Sheets Actions

**Add Row:**
```json
{
  "name": "sheets_add_row",
  "type": "PIECE",
  "valid": true,
  "displayName": "Add Row to Google Sheets",
  "settings": {
    "pieceName": "google-sheets",
    "pieceVersion": "0.1.0",
    "actionName": "append_row",
    "input": {
      "authentication": "{{connections.google_sheets}}",
      "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      "sheet_id": "Sheet1",
      "values": [
        "{{trigger.body.name}}",
        "{{trigger.body.email}}",
        "{{trigger.body.timestamp}}"
      ]
    },
    "inputUiInfo": {
      "customizedInputs": {}
    }
  }
}
```

### Code Actions

Execute custom JavaScript code:

```json
{
  "name": "custom_code",
  "type": "CODE",
  "valid": true,
  "displayName": "Process Data",
  "settings": {
    "sourceCode": {
      "packageJson": "{\"dependencies\": {\"dayjs\": \"^1.11.0\"}}",
      "code": "const dayjs = require('dayjs');\n\nexport const code = async (inputs) => {\n  const { data } = inputs;\n  \n  // Process the data\n  const processed = {\n    ...data,\n    processedAt: dayjs().toISOString(),\n    processed: true\n  };\n  \n  return processed;\n};"
    },
    "input": {
      "data": "{{trigger.body}}"
    },
    "inputUiInfo": {
      "customizedInputs": {}
    },
    "errorHandlingOptions": {
      "continueOnFailure": {
        "value": false
      },
      "retryOnFailure": {
        "value": true
      }
    }
  }
}
```

### Loop Actions

Iterate over arrays or objects:

```json
{
  "name": "loop_items",
  "type": "LOOP_ON_ITEMS",
  "valid": true,
  "displayName": "Process Each Item",
  "settings": {
    "items": "{{trigger.body.items}}",
    "inputUiInfo": {
      "customizedInputs": {}
    }
  },
  "firstLoopAction": {
    "name": "process_item",
    "type": "PIECE",
    "valid": true,
    "displayName": "Process Item",
    "settings": {
      "pieceName": "http",
      "pieceVersion": "0.20.3",
      "actionName": "send_request",
      "input": {
        "method": "POST",
        "url": "https://api.example.com/process",
        "headers": {
          "Content-Type": "application/json"
        },
        "body_type": "json",
        "body": {
          "data": {
            "item": "{{loop.item}}"
          }
        }
      },
      "inputUiInfo": {
        "customizedInputs": {}
      }
    }
  },
  "nextAction": {
    // Action to run after loop completes
  }
}
```

### Router Actions (Conditional Branching)

Create conditional logic in your flows:

```json
{
  "name": "router",
  "type": "ROUTER",
  "valid": true,
  "displayName": "Route Based on Condition",
  "settings": {
    "executionType": "EXECUTE_FIRST_MATCH",
    "branches": [
      {
        "branchType": "CONDITION",
        "branchName": "High Priority",
        "conditions": [
          [
            {
              "firstValue": "{{trigger.body.priority}}",
              "secondValue": "high",
              "operator": "TEXT_EXACTLY_MATCHES",
              "caseSensitive": false
            }
          ]
        ]
      },
      {
        "branchType": "CONDITION", 
        "branchName": "Medium Priority",
        "conditions": [
          [
            {
              "firstValue": "{{trigger.body.priority}}",
              "secondValue": "medium",
              "operator": "TEXT_EXACTLY_MATCHES",
              "caseSensitive": false
            }
          ]
        ]
      },
      {
        "branchType": "FALLBACK",
        "branchName": "Default"
      }
    ],
    "inputUiInfo": {
      "customizedInputs": {}
    }
  },
  "children": [
    {
      // Action for first branch (High Priority)
      "name": "high_priority_action",
      "type": "PIECE",
      "valid": true,
      "displayName": "Handle High Priority",
      "settings": {
        "pieceName": "slack",
        "pieceVersion": "0.2.1",
        "actionName": "send_channel_message",
        "input": {
          "authentication": "{{connections.slack}}",
          "channel": "urgent",
          "text": "🚨 High Priority Alert: {{trigger.body.message}}"
        },
        "inputUiInfo": {
          "customizedInputs": {}
        }
      }
    },
    {
      // Action for second branch (Medium Priority)
      "name": "medium_priority_action",
      "type": "PIECE",
      "valid": true,
      "displayName": "Handle Medium Priority",
      "settings": {
        "pieceName": "slack",
        "pieceVersion": "0.2.1",
        "actionName": "send_channel_message",
        "input": {
          "authentication": "{{connections.slack}}",
          "channel": "alerts",
          "text": "⚠️ Medium Priority: {{trigger.body.message}}"
        },
        "inputUiInfo": {
          "customizedInputs": {}
        }
      }
    },
    {
      // Action for fallback branch
      "name": "default_action",
      "type": "PIECE",
      "valid": true,
      "displayName": "Handle Default",
      "settings": {
        "pieceName": "slack",
        "pieceVersion": "0.2.1",
        "actionName": "send_channel_message",
        "input": {
          "authentication": "{{connections.slack}}",
          "channel": "general",
          "text": "ℹ️ Low Priority: {{trigger.body.message}}"
        },
        "inputUiInfo": {
          "customizedInputs": {}
        }
      }
    }
  ],
  "nextAction": {
    // Action to run after router completes
  }
}
```

### Router Execution Types

- `"EXECUTE_FIRST_MATCH"`: Execute only the first matching branch
- `"EXECUTE_ALL_MATCH"`: Execute all matching branches

### Branch Operators

#### Text Operations
- `"TEXT_CONTAINS"`: Check if text contains substring
- `"TEXT_DOES_NOT_CONTAIN"`: Check if text does not contain substring
- `"TEXT_EXACTLY_MATCHES"`: Exact text match
- `"TEXT_DOES_NOT_EXACTLY_MATCH"`: Not exact text match
- `"TEXT_STARTS_WITH"`: Text starts with substring
- `"TEXT_DOES_NOT_START_WITH"`: Text does not start with substring
- `"TEXT_ENDS_WITH"`: Text ends with substring
- `"TEXT_DOES_NOT_END_WITH"`: Text does not end with substring

#### Number Operations
- `"NUMBER_IS_GREATER_THAN"`: Number comparison (>)
- `"NUMBER_IS_LESS_THAN"`: Number comparison (<)
- `"NUMBER_IS_EQUAL_TO"`: Number comparison (=)

#### Boolean Operations
- `"BOOLEAN_IS_TRUE"`: Check if value is true
- `"BOOLEAN_IS_FALSE"`: Check if value is false

#### Date Operations
- `"DATE_IS_BEFORE"`: Date comparison (before)
- `"DATE_IS_EQUAL"`: Date comparison (equal)
- `"DATE_IS_AFTER"`: Date comparison (after)

#### List Operations
- `"LIST_CONTAINS"`: Check if list contains item
- `"LIST_DOES_NOT_CONTAIN"`: Check if list does not contain item
- `"LIST_IS_EMPTY"`: Check if list is empty
- `"LIST_IS_NOT_EMPTY"`: Check if list is not empty

#### Existence Operations
- `"EXISTS"`: Check if value exists/is not null
- `"DOES_NOT_EXIST"`: Check if value does not exist/is null

## Properties and Data Types

Activepieces supports various property types for action inputs:

### Basic Properties

#### ShortText
```json
{
  "displayName": "Name",
  "description": "Enter your name",
  "required": true,
  "defaultValue": "John Doe"
}
```

#### LongText
```json
{
  "displayName": "Message",
  "description": "Enter your message",
  "required": true
}
```

#### Number
```json
{
  "displayName": "Count",
  "description": "Number of items",
  "required": true,
  "defaultValue": 10
}
```

#### Checkbox
```json
{
  "displayName": "Enable Feature",
  "description": "Check to enable this feature",
  "required": false,
  "defaultValue": false
}
```

### Advanced Properties

#### Dropdown (Dynamic)
```json
{
  "displayName": "Channel",
  "description": "Select a Slack channel",
  "required": true,
  "refreshers": []
}
```

#### StaticDropdown
```json
{
  "displayName": "Priority",
  "description": "Select priority level",
  "required": true,
  "defaultValue": "medium",
  "options": {
    "disabled": false,
    "options": [
      { "label": "High", "value": "high" },
      { "label": "Medium", "value": "medium" },
      { "label": "Low", "value": "low" }
    ]
  }
}
```

#### JSON
```json
{
  "displayName": "JSON Data",
  "description": "Enter JSON data",
  "required": false
}
```

#### Array
```json
{
  "displayName": "Items",
  "description": "List of items",
  "required": true
}
```

#### File
```json
{
  "displayName": "Attachment",
  "description": "Upload a file",
  "required": false
}
```

#### Object
```json
{
  "displayName": "Headers",
  "description": "HTTP headers",
  "required": true
}
```

### Dynamic Properties

Properties that change based on other property values:

```json
{
  "displayName": "Authentication Fields",
  "required": false,
  "refreshers": ["authType"],
  "props": {
    // Dynamic properties based on authType value
  }
}
```

## Connections and Authentication

Connections store authentication credentials for external services.

### Connection Types

#### OAuth2
```json
{
  "authentication": "{{connections.slack}}"
}
```

#### API Key
```json
{
  "authentication": "{{connections.api_key}}"
}
```

#### Basic Auth
```json
{
  "authentication": "{{connections.basic_auth}}"
}
```

### Using Connections in Actions

Reference connections using the mustache template syntax:

```json
{
  "input": {
    "authentication": "{{connections.slack}}",
    "api_key": "{{connections.openai_key}}",
    "token": "{{connections.github_token}}"
  }
}
```

## Flow Control

### Data Flow and References

Use mustache template syntax to reference data from previous steps:

#### Trigger Data
```json
{
  "text": "New user: {{trigger.body.name}}"
}
```

#### Previous Step Data
```json
{
  "message": "HTTP response: {{http_request.body.result}}"
}
```

#### Loop Data
```json
{
  "item": "{{loop.item}}",
  "index": "{{loop.index}}"
}
```

### Error Handling

Configure how actions handle errors:

```json
{
  "errorHandlingOptions": {
    "continueOnFailure": {
      "value": true
    },
    "retryOnFailure": {
      "value": true
    }
  }
}
```

### Skip Actions

Conditionally skip actions:

```json
{
  "skip": true
}
```

## Common Pieces Reference

### Core Pieces

#### HTTP
- **Piece Name**: `"http"`
- **Version**: `"0.20.3"`
- **Actions**: `"send_request"`

#### Schedule
- **Piece Name**: `"schedule"`
- **Version**: `"0.0.2"`
- **Triggers**: `"cron_expression"`, `"every_hour"`, `"every_day"`, `"every_week"`, `"every_month"`, `"every_x_minutes"`

#### Webhook
- **Piece Name**: `"webhook"`
- **Version**: `"0.1.0"`
- **Triggers**: `"catch_hook"`

### Communication Pieces

#### Slack
- **Piece Name**: `"slack"`
- **Version**: `"0.2.1"`
- **Actions**: `"send_channel_message"`, `"send_direct_message"`, `"upload_file"`, `"create_channel"`
- **Triggers**: `"new_message"`, `"new_direct_message"`, `"new_mention"`, `"new_reaction_added"`

#### Discord
- **Piece Name**: `"discord"`
- **Version**: `"0.2.1"`
- **Actions**: `"send_message_webhook"`, `"send_message"`

#### Email (SMTP)
- **Piece Name**: `"smtp"`
- **Version**: `"0.1.0"`
- **Actions**: `"send_email"`

### Data and Storage Pieces

#### Google Sheets
- **Piece Name**: `"google-sheets"`
- **Version**: `"0.1.0"`
- **Actions**: `"append_row"`, `"update_row"`, `"get_row"`, `"create_spreadsheet"`

#### Airtable
- **Piece Name**: `"airtable"`
- **Version**: `"0.1.0"`
- **Actions**: `"create_record"`, `"update_record"`, `"get_record"`

#### CSV
- **Piece Name**: `"csv"`
- **Version**: `"0.1.0"`
- **Actions**: `"read_csv"`, `"write_csv"`

### AI and Text Processing

#### OpenAI
- **Piece Name**: `"openai"`
- **Version**: `"0.1.0"`
- **Actions**: `"chat_completion"`, `"text_completion"`, `"create_image"`

#### Text Helper
- **Piece Name**: `"text-helper"`
- **Version**: `"0.1.0"`
- **Actions**: `"extract_text"`, `"replace_text"`, `"split_text"`

### Development Tools

#### GitHub
- **Piece Name**: `"github"`
- **Version**: `"0.1.3"`
- **Actions**: `"create_issue"`, `"create_pull_request"`
- **Triggers**: `"new_issue"`, `"new_pull_request"`

#### Store
- **Piece Name**: `"store"`
- **Version**: `"0.2.6"`
- **Actions**: `"get"`, `"put"`, `"delete"`

## Complete Flow Examples

### Example 1: Simple Webhook to Slack

```json
{
  "id": "webhook_to_slack_flow",
  "projectId": "project_123",
  "externalId": "webhook_slack_001",
  "status": "ENABLED",
  "version": {
    "id": "version_123",
    "displayName": "Webhook to Slack Notification",
    "valid": true,
    "schemaVersion": "5",
    "state": "DRAFT",
    "trigger": {
      "name": "trigger",
      "type": "PIECE_TRIGGER",
      "valid": true,
      "displayName": "Webhook Trigger",
      "settings": {
        "pieceName": "webhook",
        "pieceVersion": "0.1.0",
        "triggerName": "catch_hook",
        "input": {},
        "inputUiInfo": {
          "customizedInputs": {}
        }
      },
      "nextAction": {
        "name": "slack_notification",
        "type": "PIECE",
        "valid": true,
        "displayName": "Send Slack Notification",
        "settings": {
          "pieceName": "slack",
          "pieceVersion": "0.2.1",
          "actionName": "send_channel_message",
          "input": {
            "authentication": "{{connections.slack}}",
            "channel": "general",
            "text": "🔔 Webhook received: {{trigger.body.message}}",
            "username": "Webhook Bot"
          },
          "inputUiInfo": {
            "customizedInputs": {}
          }
        }
      }
    }
  }
}
```

### Example 2: Scheduled Data Processing with Loop

```json
{
  "id": "scheduled_data_processing",
  "projectId": "project_123",
  "externalId": "data_processing_001",
  "status": "ENABLED",
  "version": {
    "id": "version_456",
    "displayName": "Daily Data Processing",
    "valid": true,
    "schemaVersion": "5",
    "state": "DRAFT",
    "trigger": {
      "name": "trigger",
      "type": "PIECE_TRIGGER",
      "valid": true,
      "displayName": "Daily Schedule",
      "settings": {
        "pieceName": "schedule",
        "pieceVersion": "0.0.2",
        "triggerName": "every_day",
        "input": {
          "hour": 9,
          "minute": 0,
          "timezone": "UTC"
        },
        "inputUiInfo": {
          "customizedInputs": {}
        }
      },
      "nextAction": {
        "name": "fetch_data",
        "type": "PIECE",
        "valid": true,
        "displayName": "Fetch Data from API",
        "settings": {
          "pieceName": "http",
          "pieceVersion": "0.20.3",
          "actionName": "send_request",
          "input": {
            "method": "GET",
            "url": "https://api.example.com/data",
            "headers": {
              "Authorization": "Bearer {{connections.api_token}}"
            },
            "queryParams": {},
            "authType": "BEARER_TOKEN",
            "authFields": {
              "token": "{{connections.api_token}}"
            }
          },
          "inputUiInfo": {
            "customizedInputs": {}
          }
        },
        "nextAction": {
          "name": "process_items",
          "type": "LOOP_ON_ITEMS",
          "valid": true,
          "displayName": "Process Each Item",
          "settings": {
            "items": "{{fetch_data.body.items}}",
            "inputUiInfo": {
              "customizedInputs": {}
            }
          },
          "firstLoopAction": {
            "name": "process_item",
            "type": "CODE",
            "valid": true,
            "displayName": "Transform Item",
            "settings": {
              "sourceCode": {
                "packageJson": "{\"dependencies\": {\"dayjs\": \"^1.11.0\"}}",
                "code": "const dayjs = require('dayjs');\n\nexport const code = async (inputs) => {\n  const { item } = inputs;\n  \n  return {\n    id: item.id,\n    name: item.name.toUpperCase(),\n    processedAt: dayjs().toISOString(),\n    status: 'processed'\n  };\n};"
              },
              "input": {
                "item": "{{loop.item}}"
              },
              "inputUiInfo": {
                "customizedInputs": {}
              }
            },
            "nextAction": {
              "name": "save_to_sheets",
              "type": "PIECE",
              "valid": true,
              "displayName": "Save to Google Sheets",
              "settings": {
                "pieceName": "google-sheets",
                "pieceVersion": "0.1.0",
                "actionName": "append_row",
                "input": {
                  "authentication": "{{connections.google_sheets}}",
                  "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
                  "sheet_id": "Sheet1",
                  "values": [
                    "{{process_item.id}}",
                    "{{process_item.name}}",
                    "{{process_item.processedAt}}",
                    "{{process_item.status}}"
                  ]
                },
                "inputUiInfo": {
                  "customizedInputs": {}
                }
              }
            }
          },
          "nextAction": {
            "name": "completion_notification",
            "type": "PIECE",
            "valid": true,
            "displayName": "Send Completion Notification",
            "settings": {
              "pieceName": "slack",
              "pieceVersion": "0.2.1",
              "actionName": "send_channel_message",
              "input": {
                "authentication": "{{connections.slack}}",
                "channel": "data-processing",
                "text": "✅ Daily data processing completed successfully. Processed {{fetch_data.body.items.length}} items."
              },
              "inputUiInfo": {
                "customizedInputs": {}
              }
            }
          }
        }
      }
    }
  }
}
```

### Example 3: Complex Router with Multiple Conditions

```json
{
  "id": "support_ticket_router",
  "projectId": "project_123",
  "externalId": "support_router_001",
  "status": "ENABLED",
  "version": {
    "id": "version_789",
    "displayName": "Support Ticket Router",
    "valid": true,
    "schemaVersion": "5",
    "state": "DRAFT",
    "trigger": {
      "name": "trigger",
      "type": "PIECE_TRIGGER",
      "valid": true,
      "displayName": "New Support Ticket",
      "settings": {
        "pieceName": "webhook",
        "pieceVersion": "0.1.0",
        "triggerName": "catch_hook",
        "input": {},
        "inputUiInfo": {
          "customizedInputs": {}
        }
      },
      "nextAction": {
        "name": "ticket_router",
        "type": "ROUTER",
        "valid": true,
        "displayName": "Route Ticket by Priority and Type",
        "settings": {
          "executionType": "EXECUTE_FIRST_MATCH",
          "branches": [
            {
              "branchType": "CONDITION",
              "branchName": "Critical Bug",
              "conditions": [
                [
                  {
                    "firstValue": "{{trigger.body.priority}}",
                    "secondValue": "critical",
                    "operator": "TEXT_EXACTLY_MATCHES",
                    "caseSensitive": false
                  },
                  {
                    "firstValue": "{{trigger.body.type}}",
                    "secondValue": "bug",
                    "operator": "TEXT_EXACTLY_MATCHES",
                    "caseSensitive": false
                  }
                ]
              ]
            },
            {
              "branchType": "CONDITION",
              "branchName": "High Priority",
              "conditions": [
                [
                  {
                    "firstValue": "{{trigger.body.priority}}",
                    "secondValue": "high",
                    "operator": "TEXT_EXACTLY_MATCHES",
                    "caseSensitive": false
                  }
                ]
              ]
            },
            {
              "branchType": "CONDITION",
              "branchName": "Feature Request",
              "conditions": [
                [
                  {
                    "firstValue": "{{trigger.body.type}}",
                    "secondValue": "feature",
                    "operator": "TEXT_EXACTLY_MATCHES",
                    "caseSensitive": false
                  }
                ]
              ]
            },
            {
              "branchType": "FALLBACK",
              "branchName": "Standard Support"
            }
          ],
          "inputUiInfo": {
            "customizedInputs": {}
          }
        },
        "children": [
          {
            "name": "critical_bug_handler",
            "type": "PIECE",
            "valid": true,
            "displayName": "Handle Critical Bug",
            "settings": {
              "pieceName": "slack",
              "pieceVersion": "0.2.1",
              "actionName": "send_channel_message",
              "input": {
                "authentication": "{{connections.slack}}",
                "channel": "critical-bugs",
                "text": "🚨 CRITICAL BUG ALERT 🚨\n\n**Ticket #**: {{trigger.body.id}}\n**Subject**: {{trigger.body.subject}}\n**Customer**: {{trigger.body.customer}}\n**Description**: {{trigger.body.description}}\n\n@channel - Immediate attention required!"
              },
              "inputUiInfo": {
                "customizedInputs": {}
              }
            },
            "nextAction": {
              "name": "create_jira_critical",
              "type": "PIECE",
              "valid": true,
              "displayName": "Create Critical Jira Issue",
              "settings": {
                "pieceName": "jira-cloud",
                "pieceVersion": "0.1.0",
                "actionName": "create_issue",
                "input": {
                  "authentication": "{{connections.jira}}",
                  "project": "SUP",
                  "issueType": "Bug",
                  "priority": "Highest",
                  "summary": "CRITICAL: {{trigger.body.subject}}",
                  "description": "Customer: {{trigger.body.customer}}\n\n{{trigger.body.description}}\n\nTicket ID: {{trigger.body.id}}"
                },
                "inputUiInfo": {
                  "customizedInputs": {}
                }
              }
            }
          },
          {
            "name": "high_priority_handler",
            "type": "PIECE",
            "valid": true,
            "displayName": "Handle High Priority",
            "settings": {
              "pieceName": "slack",
              "pieceVersion": "0.2.1",
              "actionName": "send_channel_message",
              "input": {
                "authentication": "{{connections.slack}}",
                "channel": "high-priority",
                "text": "⚡ High Priority Ticket\n\n**Ticket #**: {{trigger.body.id}}\n**Subject**: {{trigger.body.subject}}\n**Customer**: {{trigger.body.customer}}"
              },
              "inputUiInfo": {
                "customizedInputs": {}
              }
            }
          },
          {
            "name": "feature_request_handler",
            "type": "PIECE",
            "valid": true,
            "displayName": "Handle Feature Request",
            "settings": {
              "pieceName": "slack",
              "pieceVersion": "0.2.1",
              "actionName": "send_channel_message",
              "input": {
                "authentication": "{{connections.slack}}",
                "channel": "feature-requests",
                "text": "💡 New Feature Request\n\n**Ticket #**: {{trigger.body.id}}\n**Subject**: {{trigger.body.subject}}\n**Customer**: {{trigger.body.customer}}\n**Description**: {{trigger.body.description}}"
              },
              "inputUiInfo": {
                "customizedInputs": {}
              }
            }
          },
          {
            "name": "standard_handler",
            "type": "PIECE",
            "valid": true,
            "displayName": "Handle Standard Support",
            "settings": {
              "pieceName": "slack",
              "pieceVersion": "0.2.1",
              "actionName": "send_channel_message",
              "input": {
                "authentication": "{{connections.slack}}",
                "channel": "general-support",
                "text": "📋 New Support Ticket\n\n**Ticket #**: {{trigger.body.id}}\n**Subject**: {{trigger.body.subject}}\n**Customer**: {{trigger.body.customer}}"
              },
              "inputUiInfo": {
                "customizedInputs": {}
              }
            }
          }
        ]
      }
    }
  }
}
```

## Best Practices

### 1. Naming Conventions

- Use descriptive names for steps: `"send_slack_notification"` instead of `"step_1"`
- Use consistent naming patterns across flows
- Include the action purpose in the display name

### 2. Error Handling

Always configure error handling for critical steps:

```json
{
  "errorHandlingOptions": {
    "continueOnFailure": {
      "value": false
    },
    "retryOnFailure": {
      "value": true
    }
  }
}
```

### 3. Data References

Use clear, descriptive references:
- `{{trigger.body.user_email}}` instead of `{{trigger.body.data[0]}}`
- Test data references before deploying

### 4. Validation

- Always set `"valid": true` for working steps
- Use the latest piece versions
- Test flows before setting status to `"ENABLED"`

### 5. Security

- Never hardcode sensitive data in flows
- Use connections for all authentication
- Be careful with webhook endpoints

### 6. Performance

- Use specific piece versions instead of `"latest"`
- Avoid deeply nested loops
- Consider using filters before loops

### 7. Maintainability

- Add meaningful display names and descriptions
- Document complex logic in code actions
- Use consistent formatting

## Troubleshooting

### Common Issues

#### 1. Invalid Step References

**Problem**: `{{step_name.property}}` returns undefined
**Solution**: 
- Check step name matches exactly
- Verify the property exists in the step output
- Use the test feature to inspect step outputs

#### 2. Connection Issues

**Problem**: Authentication fails
**Solution**:
- Verify connection is properly configured
- Check connection permissions/scopes
- Ensure connection reference syntax is correct: `{{connections.connection_name}}`

#### 3. Validation Errors

**Problem**: Flow shows as invalid
**Solution**:
- Check all required fields are filled
- Verify piece versions are supported
- Ensure proper JSON structure

#### 4. Loop Issues

**Problem**: Loop doesn't iterate properly
**Solution**:
- Verify items property contains an array
- Check array structure and data types
- Test with sample data

#### 5. Router Conditions

**Problem**: Router doesn't match expected conditions
**Solution**:
- Verify condition syntax and operators
- Check data types (string vs number)
- Test conditions with actual data
- Use case-sensitive matching when needed

### Debugging Tips

1. **Use Test Mode**: Test individual steps to verify outputs
2. **Check Logs**: Review execution logs for errors
3. **Validate JSON**: Ensure proper JSON syntax
4. **Start Simple**: Build complex flows incrementally
5. **Use Sample Data**: Test with known data before live deployment

### Piece Version Updates

When updating piece versions:
1. Check changelog for breaking changes
2. Update all instances of the piece
3. Test thoroughly before deployment
4. Have rollback plan ready

## Advanced Topics

### Custom Pieces

You can create custom pieces for specific needs:

```json
{
  "pieceName": "my-custom-piece",
  "pieceVersion": "1.0.0",
  "actionName": "custom_action"
}
```

### Subflows

Break complex workflows into reusable subflows:

```json
{
  "pieceName": "subflows",
  "pieceVersion": "0.1.0",
  "actionName": "call_subflow",
  "input": {
    "subflowId": "reusable_process_001",
    "input": {
      "data": "{{trigger.body}}"
    }
  }
}
```

### Environment Variables

Use environment-specific configurations:

```json
{
  "url": "{{system.environment === 'production' ? 'https://api.prod.com' : 'https://api.staging.com'}}"
}
```

### Batch Processing

Handle large datasets efficiently:

```json
{
  "name": "batch_processor",
  "type": "CODE",
  "settings": {
    "sourceCode": {
      "code": "export const code = async (inputs) => {\n  const { items } = inputs;\n  const batchSize = 10;\n  const batches = [];\n  \n  for (let i = 0; i < items.length; i += batchSize) {\n    batches.push(items.slice(i, i + batchSize));\n  }\n  \n  return { batches };\n};"
    },
    "input": {
      "items": "{{fetch_data.body.items}}"
    }
  }
}
```

This comprehensive guide covers all aspects of the Activepieces automation JSON format. Use it as a reference when building flows programmatically or when working with LLMs to generate automations. Remember to always test your flows thoroughly before deploying them to production.
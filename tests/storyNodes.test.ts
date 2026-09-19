import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { STORY_NODES } from '../src/data/storyNodes.ts';

describe('Story Nodes & Graph Integrity', () => {
  it('should have START_SCHOOL as the entry point', () => {
    assert.ok(STORY_NODES['START_SCHOOL'], 'START_SCHOOL node must exist');
    assert.strictEqual(STORY_NODES['START_SCHOOL'].id, 'START_SCHOOL');
    assert.ok(STORY_NODES['START_SCHOOL'].choices.length > 0, 'START_SCHOOL must have choices');
  });

  it('should ensure all choice targetNodeIds point to existing nodes', () => {
    for (const [nodeId, node] of Object.entries(STORY_NODES)) {
      for (const choice of node.choices) {
        if (choice.targetNodeId) {
          assert.ok(
            STORY_NODES[choice.targetNodeId],
            `Node [${nodeId}] choice points to non-existent target [${choice.targetNodeId}]`
          );
        }
      }
    }
  });

  it('should ensure all ending nodes have isEnding and non-empty endingReason', () => {
    const endingNodes = Object.values(STORY_NODES).filter((n) => n.isEnding);
    assert.ok(endingNodes.length >= 3, 'Must have multiple ending nodes');

    for (const node of endingNodes) {
      assert.strictEqual(node.isEnding, true);
      assert.ok(node.endingReason && node.endingReason.length > 0, `Ending node [${node.id}] must have endingReason`);
      assert.strictEqual(node.choices.length, 0, `Ending node [${node.id}] must not offer subsequent choices`);
    }
  });

  it('should ensure actions have valid types and levels', () => {
    for (const [nodeId, node] of Object.entries(STORY_NODES)) {
      for (const choice of node.choices) {
        if (choice.action) {
          assert.ok(
            ['FIGHT', 'ROB', 'CINEMATIC'].includes(choice.action.type),
            `Node [${nodeId}] has invalid action type [${choice.action.type}]`
          );
          if (choice.action.type === 'FIGHT' || choice.action.type === 'ROB') {
            assert.ok(
              [1, 2, 3].includes(choice.action.level),
              `Node [${nodeId}] action level must be 1, 2, or 3`
            );
          }
        }
      }
    }
  });

  it('enforces rule: Rob 1 and Rob 2 failures and surrender choices must result in arrest (not death)', () => {
    // Rob 1 node
    const rob1Intro = STORY_NODES['THIEVES_STAGE_INTRO'];
    assert.ok(rob1Intro, 'THIEVES_STAGE_INTRO must exist');
    const rob1Surrender = rob1Intro.choices.find((c) => c.text.includes('No') || c.text.includes('Surrender'));
    assert.ok(rob1Surrender, 'Rob 1 surrender choice must exist');
    assert.strictEqual(
      rob1Surrender.targetNodeId,
      'ENDING_ARRESTED_STREET',
      'Rob 1 surrender must lead to arrest, not death'
    );

    // Rob 2 node
    const rob2Intro = STORY_NODES['STAGE_ROB_2_INTRO'];
    assert.ok(rob2Intro, 'STAGE_ROB_2_INTRO must exist');
    const rob2Surrender = rob2Intro.choices.find((c) => c.text.includes('No') || c.text.includes('Surrender'));
    assert.ok(rob2Surrender, 'Rob 2 surrender choice must exist');
    assert.strictEqual(
      rob2Surrender.targetNodeId,
      'ENDING_ARRESTED_STREET',
      'Rob 2 surrender must lead to arrest, not death'
    );

    // Verify ENDING_ARRESTED_STREET is indeed an arrest ending
    const streetArrestNode = STORY_NODES['ENDING_ARRESTED_STREET'];
    assert.ok(streetArrestNode, 'ENDING_ARRESTED_STREET must exist');
    assert.strictEqual(streetArrestNode.isEnding, true);
    assert.ok(streetArrestNode.endingReason?.toLowerCase().includes('arrest'), 'Must be an arrest ending');
  });

  it('enforces rule: Death/collapse is only for the 3rd robbery stage', () => {
    const rob3Intro = STORY_NODES['STAGE_ROB_3_INTRO'];
    assert.ok(rob3Intro, 'STAGE_ROB_3_INTRO must exist');
    
    // Check surrender option for Rob 3
    const rob3Surrender = rob3Intro.choices.find((c) => c.text.includes('No') || c.text.includes('Chest'));
    assert.ok(rob3Surrender, 'Rob 3 surrender choice must exist');
    assert.strictEqual(
      rob3Surrender.targetNodeId,
      'CLIMAX_ESCAPE',
      'Rob 3 surrender must lead directly to final climax collapse'
    );

    // Check CLIMAX_ESCAPE triggers cinematic sequence
    const climaxNode = STORY_NODES['CLIMAX_ESCAPE'];
    assert.ok(climaxNode, 'CLIMAX_ESCAPE must exist');
    assert.ok(climaxNode.choices.length > 0, 'CLIMAX_ESCAPE must have choice to trigger cinematic');
    assert.strictEqual(climaxNode.choices[0].action?.type, 'CINEMATIC');
  });

  it('enforces rule: No numerical counts in choice prompts or stage titles', () => {
    for (const [nodeId, node] of Object.entries(STORY_NODES)) {
      assert.doesNotMatch(
        node.stageTitle,
        /(Target|Robbery)\s+[0-9]/i,
        `Node [${nodeId}] stageTitle contains prohibited numerical count`
      );
      for (const choice of node.choices) {
        assert.doesNotMatch(
          choice.text,
          /^[0-9]+[\.\)]\s*/,
          `Node [${nodeId}] choice [${choice.text}] begins with numeric enumeration`
        );
      }
    }
  });
});

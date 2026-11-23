import type * as TS from 'typescript';

/**
 * TypeScript transformer that inserts `__lg();` at the start of every loop body.
 * The sandbox harness provides `__lg`, which throws if the event loop has been blocked
 * for several seconds — turning an accidental `while (true)` into a reportable error
 * instead of a frozen tab.
 */
export function createLoopGuardTransformer(ts: typeof TS): TS.TransformerFactory<TS.SourceFile> {
  return (context) => {
    const f = context.factory;
    const guardCall = () => f.createExpressionStatement(f.createCallExpression(f.createIdentifier('__lg'), undefined, []));
    const guardBody = (body: TS.Statement): TS.Statement => {
      if (ts.isBlock(body)) return f.updateBlock(body, [guardCall(), ...body.statements]);
      return f.createBlock([guardCall(), body], true);
    };
    const visit = (node: TS.Node): TS.Node => {
      const n = ts.visitEachChild(node, visit, context);
      if (ts.isWhileStatement(n)) return f.updateWhileStatement(n, n.expression, guardBody(n.statement));
      if (ts.isDoStatement(n)) return f.updateDoStatement(n, guardBody(n.statement), n.expression);
      if (ts.isForStatement(n)) return f.updateForStatement(n, n.initializer, n.condition, n.incrementor, guardBody(n.statement));
      if (ts.isForInStatement(n)) return f.updateForInStatement(n, n.initializer, n.expression, guardBody(n.statement));
      if (ts.isForOfStatement(n)) return f.updateForOfStatement(n, n.awaitModifier, n.initializer, n.expression, guardBody(n.statement));
      return n;
    };
    return (sf) => ts.visitNode(sf, visit) as TS.SourceFile;
  };
}

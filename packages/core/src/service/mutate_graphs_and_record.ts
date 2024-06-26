import { cloneDeep } from '@suika/common';

import { SetGraphsAttrsCmd } from '../commands/set_elements_attrs';
import { type Editor } from '../editor';
import { type SuikaGraphics, type SuikaRect } from '../graphs';
import { type SuikaRegularPolygon } from '../graphs/regular_polygon';
import { type SuikaStar } from '../graphs/star';
import { Transaction } from '../transaction';
import { GraphicsType } from '../type';

/**
 * mutate elements and record to history
 */
export const MutateGraphsAndRecord = {
  setX(editor: Editor, graphicsArr: SuikaGraphics[], val: number) {
    if (graphicsArr.length === 0) {
      return;
    }

    const transaction = new Transaction(editor);

    for (const graphics of graphicsArr) {
      transaction.recordOld(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });

      const tf = graphics.getWorldTransform();
      tf[4] = val;

      graphics.setWorldTransform(tf);
      transaction.update(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });
    }

    transaction.updateParentSize(graphicsArr);
    transaction.commit('Update X of Elements');
  },
  setY(editor: Editor, graphicsArr: SuikaGraphics[], val: number) {
    if (graphicsArr.length === 0) {
      return;
    }

    const transaction = new Transaction(editor);

    for (const graphics of graphicsArr) {
      transaction.recordOld(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });

      const tf = graphics.getWorldTransform();
      tf[5] = val;

      graphics.setWorldTransform(tf);
      transaction.update(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });
    }

    transaction.updateParentSize(graphicsArr);
    transaction.commit('Update Y of Elements');
  },
  setWidth(editor: Editor, graphicsArr: SuikaGraphics[], val: number) {
    if (graphicsArr.length === 0) {
      return;
    }

    const transaction = new Transaction(editor);
    for (const graphics of graphicsArr) {
      transaction.recordOld(graphics.attrs.id, { width: graphics.attrs.width });
      graphics.updateAttrs({ width: val });
      transaction.update(graphics.attrs.id, { width: graphics.attrs.width });
    }

    transaction.updateParentSize(graphicsArr);
    // FIXME: update children
    transaction.commit('Update Width of Elements');
  },
  setHeight(editor: Editor, graphicsArr: SuikaGraphics[], val: number) {
    if (graphicsArr.length === 0) {
      return;
    }

    const transaction = new Transaction(editor);
    for (const graphics of graphicsArr) {
      transaction.recordOld(graphics.attrs.id, {
        height: graphics.attrs.height,
      });
      graphics.updateAttrs({ height: val });
      transaction.update(graphics.attrs.id, { height: graphics.attrs.height });
    }

    transaction.updateParentSize(graphicsArr);
    // FIXME: update children
    transaction.commit('Update Height of Elements');
  },
  setRotation(editor: Editor, graphicsArr: SuikaGraphics[], rotation: number) {
    if (graphicsArr.length === 0) {
      return;
    }

    const transaction = new Transaction(editor);

    for (const graphics of graphicsArr) {
      transaction.recordOld(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });
      graphics.setRotate(rotation);
      transaction.update(graphics.attrs.id, {
        transform: cloneDeep(graphics.attrs.transform),
      });
    }

    transaction.updateParentSize(graphicsArr);
    transaction.commit('Update Rotation');
  },
  setCornerRadius(
    editor: Editor,
    graphicsArr: SuikaGraphics[],
    cornerRadius: number,
  ) {
    if (graphicsArr.length === 0) {
      return;
    }

    const rectGraphics = graphicsArr.filter(
      (el) => el.type === GraphicsType.Rect,
    ) as SuikaRect[];

    const prevAttrs = rectGraphics.map((el) => ({
      cornerRadius: el.attrs.cornerRadius || 0,
    }));
    rectGraphics.forEach((el) => {
      el.attrs.cornerRadius = cornerRadius;
    });
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update Corner Radius',
        rectGraphics,
        { cornerRadius },
        prevAttrs,
      ),
    );
  },

  setCount(editor: Editor, elements: SuikaGraphics[], count: number) {
    if (elements.length === 0) {
      return;
    }

    const rectGraphics = elements.filter(
      (el) =>
        el.type === GraphicsType.RegularPolygon ||
        el.type === GraphicsType.Star,
    ) as SuikaRegularPolygon[];

    const prevAttrs = rectGraphics.map((el) => ({
      count: el.attrs.count,
    }));
    rectGraphics.forEach((el) => {
      el.updateAttrs({
        count,
      });
    });
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update Count',
        rectGraphics,
        { count: count },
        prevAttrs,
      ),
    );
  },

  setStarInnerScale(editor: Editor, elements: SuikaGraphics[], val: number) {
    if (elements.length === 0) {
      return;
    }

    const rectGraphics = elements.filter(
      (el) => el.type === GraphicsType.Star,
    ) as SuikaStar[];

    const prevAttrs = rectGraphics.map((el) => ({
      starInnerScale: el.attrs.starInnerScale,
    }));
    rectGraphics.forEach((el) => {
      el.updateAttrs({
        starInnerScale: val,
      });
    });
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update Star InnerScale',
        rectGraphics,
        { count: val },
        prevAttrs,
      ),
    );
  },

  /**
   * show graphs when at least one graph is hidden
   * and
   * hide graphs when all graphs are shown
   */
  toggleVisible(editor: Editor, graphicsArr: SuikaGraphics[]) {
    if (graphicsArr.length === 0) {
      return;
    }
    // if at least one graph is hidden, show all graphs; otherwise, hide all graphs
    const newVal = graphicsArr.some((item) => !item.isVisible());

    const transaction = new Transaction(editor);

    for (const graphics of graphicsArr) {
      transaction.recordOld(graphics.attrs.id, {
        visible: graphics.attrs.visible,
      });
      graphics.updateAttrs({
        visible: newVal,
      });
      transaction.update(graphics.attrs.id, { visible: newVal });
    }

    transaction.updateParentSize(graphicsArr);
    transaction.commit('update visible of graphs');
  },
  /**
   * lock / unlock
   */
  toggleLock(editor: Editor, graphs: SuikaGraphics[]) {
    if (graphs.length === 0) {
      return;
    }

    // if at least one graph is unlocked, lock all graphs; otherwise, unlock all graphs
    const newLock = graphs.some((item) => !item.isLock());
    const prevAttrs = graphs.map((el) => ({ lock: el.attrs.lock }));
    graphs.forEach((el) => {
      el.attrs.lock = newLock;
    });
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update lock of graphs',
        graphs,
        { lock: newLock },
        prevAttrs,
      ),
    );
  },

  /** set name of graph */
  setGraphName(editor: Editor, graph: SuikaGraphics, objectName: string) {
    const prevAttrs = [{ objectName: graph.attrs.objectName }];
    graph.attrs.objectName = objectName;
    editor.commandManager.pushCommand(
      new SetGraphsAttrsCmd(
        'update name of graph',
        [graph],
        { objectName },
        prevAttrs,
      ),
    );
  },
};

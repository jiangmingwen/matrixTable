import { InteractionStateName, PivotSheet, S2CellType, S2DataConfig, S2Event, ViewMeta, Node, CellType, InteractionName, DataCell } from "@antv/s2";
import { FC, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { MatrixDataCell } from "./DataCell";
import { IImageInfo, IMatrixCanvasProps, IS2Options, MatrixField } from "./type";
import { MatrixColCell } from "./ColCell";
import { MatrixRowCell } from "./RowCell";
import { EmptyKey, getCellKey, getCellKeys, getS2Data, showTooltip } from "./config";
import { MatrixCornerHeader } from "./CornerCell";
import { FederatedMouseEvent, FederatedPointerEvent } from "@antv/g";
import { Exporter } from "./export";

export const MatrixCanvas: FC<IMatrixCanvasProps> = ({
  size = 40,
  colHeaders,
  cellIconSize,
  rowHeaders,
  showCount = true,
  rowHeaderSize = 120,
  colHeaderSize = 120,
  renderHeaderIcon,
  onContextMenu,
  onColSelect,
  onRowSelect,
  onDataSelect,
  renderCornerCell,
  renderCell,
  renderCount,
  onCheck,
  tooltip,
  emptyColHeaderText = '列表头为空',
  emptyDataText,
  emptyRowHeaderText = '行表头为空',
  checkboxActiveColor = '#1890ff',
  ref
}) => {
  const domRef = useRef<HTMLDivElement | null>(null)
  const s2Instance = useRef<PivotSheet | null>(null)


  const getS2Config = useCallback((dom: HTMLDivElement) => {


    // 添加配置
    const options: IS2Options = {
      // 有BUG 表头不生效      
      // tooltip: {
      //     enable: true,
      //     render(spreadsheet) {
      //       return new CustomTooltip(spreadsheet,tooltip) as any
      //     }
      // },

      style: {

        colCell: {
          height: (a) => {
            if (!a) return 120;
            return a.field == MatrixField.ColCountField ? size : colHeaderSize;
          },
          hideValue: !showCount,
        },
        rowCell: {
          width: (a) => {
            if (!a) return rowHeaderSize;
            return a.field == MatrixField.RowCountField ? size : rowHeaderSize;
          },
          treeWidth: 400,
        },
        dataCell: {
          width: size,
          height: size
        },
      },
      interaction: {
        hoverHighlight: true,
      },
      cornerHeader: (header, spreadsheet) => {
        return new MatrixCornerHeader(header, spreadsheet);
      },

      dataCell: (v, p) => new MatrixDataCell(v, p,),
      colCell: (v, p, c, ...rest) => {
        return new MatrixColCell({
          headerData: colData[v.value],
          onCollpase: (_e, sheet) => {
            const sheetOptions = sheet.options as IS2Options
            const { data } = getS2Data(colHeaders, rowHeaders, sheetOptions, dom)
            sheet.setDataCfg({
              data: data as any
            })
            sheet.render(true)
          },
        }, v, p, c, ...rest)
      },
      rowCell: (v, p, c, ...rest) => new MatrixRowCell({
        headerData: rowData[v.value],
        onCollpase: (_e, sheet) => {
          const sheetOptions = sheet.options as IS2Options
          const { data } = getS2Data(colHeaders, rowHeaders, sheetOptions, dom)
          sheet.setDataCfg({
            data: data as any
          })
          sheet.render(true)
        },
      }, v, p, c, ...rest),
    }

    options.renderHeaderIcon = renderHeaderIcon
    options.headerIconSize = 12;
    options.renderCell = renderCell;
    options.cellIconSize = cellIconSize ?? 12
    options.renderCount = renderCount
    options.renderCornerCell = renderCornerCell
    options.rowCollapseKeyMap = {}
    options.colCollapseKeyMap = {}
    options.onCheck = onCheck
    options.showCount = showCount
    options.size = size
    options.colHeaderSize = colHeaderSize
    options.rowHeaderSize = rowHeaderSize
    options.emptyColHeaderText = emptyColHeaderText
    options.emptyDataText = emptyDataText
    options.emptyRowHeaderText = emptyRowHeaderText
    options.checkboxActiveColor = checkboxActiveColor

    const { data, rowData, colData } = getS2Data(colHeaders, rowHeaders, options, dom)


    // 配置数据
    const config: S2DataConfig = {
      fields: {
        rows: showCount ? [MatrixField.RowField, MatrixField.RowCountField] : [MatrixField.RowField],
        columns: showCount ? [MatrixField.ColunmField] : [MatrixField.ColunmField],
        values: [MatrixField.ValueField]
      },
      frozen: {
        // 默认开启行头冻结, 关闭后滚动区域为整个表格
        rowHeader: true,
        // 冻结行头时, 行头宽度占表格的 1/2, 支持动态调整 (0 - 1)
        // rowHeader: 0.2,
        colHeader: true
      },
      data: data as any,
    };

    return {
      config,
      options
    }

  }, [renderCell, colHeaders, rowHeaders, size, showCount, renderCount, showTooltip, renderCornerCell, renderHeaderIcon])


  useEffect(() => {
    if (domRef.current) {
      let defaultContextPreventFn = (e: MouseEvent) => e.preventDefault()
      if (!!onContextMenu) {
        domRef.current.addEventListener('contextmenu', defaultContextPreventFn)
      }
      const { config: s2Cfg, options: s2options } = getS2Config(domRef.current)
      const s2 = new PivotSheet(domRef.current, s2Cfg, s2options);

      const colHover = (event: FederatedMouseEvent) => {
        showTooltip(s2, event, tooltip)
      }
      const selectFn = (cells: S2CellType[]) => {
        const cell = cells[0]
        if (!cell) return
        const cellMeta = cell.getMeta() as unknown as ViewMeta
        if (cell instanceof MatrixColCell) {
          // 选中表头
          if (cellMeta.field === MatrixField.ColunmField) {
            onColSelect?.(cells.map(v => v.getMeta().value as string))
          } else {
            // 选中列的统计数字
            const colCell = cell.previousSibling as MatrixColCell;
            // TODO： 支持多选统计列
            s2.interaction.changeCell({
              cell: colCell,
              stateName: InteractionStateName.SELECTED, // 设置为选中状态
              interactionName: InteractionName.COL_CELL_CLICK,
              scrollIntoView: false
            })
          }
        } else if (cell instanceof MatrixRowCell) {
          if (cellMeta.field === MatrixField.RowField) {
            onRowSelect?.(cells.map(v => v.getMeta().value as string))
          } else {
            // 选中行的统计数字
            const rowCell = cell.previousSibling as MatrixColCell;
            // TODO： 支持多选统计列
            s2.interaction.changeCell({
              cell: rowCell,
              stateName: InteractionStateName.SELECTED, // 设置为选中状态
              interactionName: InteractionName.COL_CELL_CLICK,
              scrollIntoView: false
            })
          }
        } else if (cell instanceof MatrixDataCell) {
          onDataSelect?.(cells.map(v => {
            const keys = getCellKeys(v.getMeta() as unknown as Node)
            return {
              rowKey: keys[0],
              colKey: keys[1]
            }
          }))
        }
      }

      const contextFn = (e: FederatedPointerEvent) => {
        e.preventDefault();
        e.nativeEvent.preventDefault()

        const cell = s2.getCell(e.target)
        if (!cell) return

        const cellMeta = cell.getMeta() as unknown as Node
        //@ts-ignore
        let type: Parameters<IMatrixCanvasProps['onContextMenu']>['0'] = 'col'
        let rowKey: string | undefined
        let colKey: string | undefined
        if (cell instanceof MatrixColCell) {
          if (cellMeta.field === MatrixField.ColunmField) {
            colKey = getCellKey(CellType.COL_CELL, cellMeta.id)
            type = 'col'
          } else {
            const colCell = cell.previousSibling as MatrixColCell;
            const meta = colCell.getMeta() as unknown as Node
            colKey = getCellKey(CellType.COL_CELL, meta.id)
            type = 'colCount'
          }
        } else if (cell instanceof MatrixRowCell) {
          if (cellMeta.field === MatrixField.RowField) {
            rowKey = cellMeta.value
            type = 'row'
          } else {
            const rowCell = cell.previousSibling as MatrixColCell;
            const meta = rowCell.getMeta() as unknown as Node
            rowKey = meta.value
            type = 'rowCount'
          }
        } else if (cell instanceof DataCell) {
          const keys = getCellKeys(cellMeta)
          rowKey = keys[0]
          colKey = keys[1]
          type = 'data'
        }
        if (rowKey === EmptyKey || colKey === EmptyKey) return
        onContextMenu?.(type, e.clientX, e.clientY, rowKey, colKey)
      }

      s2.on(S2Event.COL_CELL_HOVER, colHover)
      s2.on(S2Event.ROW_CELL_HOVER, colHover)
      s2.on(S2Event.DATA_CELL_HOVER, colHover)
      s2.on(S2Event.CORNER_CELL_HOVER, s2.hideTooltip)
      s2.on(S2Event.GLOBAL_SELECTED, selectFn);
      if (!!onContextMenu) {
        s2.on(S2Event.GLOBAL_CONTEXT_MENU, contextFn)
      }

      s2.render();
      s2Instance.current = s2;
      return () => {
        s2.off(S2Event.COL_CELL_HOVER, colHover)
        s2.off(S2Event.ROW_CELL_HOVER, colHover)
        s2.off(S2Event.DATA_CELL_HOVER, colHover)
        s2.off(S2Event.CORNER_CELL_HOVER, s2.hideTooltip)
        s2.off(S2Event.GLOBAL_SELECTED, selectFn)
        if (!!onContextMenu) {
          domRef.current?.removeEventListener('contextmenu', defaultContextPreventFn)
          s2.off(S2Event.GLOBAL_CONTEXT_MENU, contextFn)
        }
      }
    }
  }, [])


  useEffect(() => {
    if (s2Instance.current && domRef.current) {
      const conf = getS2Config(domRef.current)
      s2Instance.current.setDataCfg(conf.config)
      s2Instance.current.setOptions(conf.options)
      s2Instance.current.render()
    }
  }, [getS2Config])

  useImperativeHandle(ref, () => ({
    export() {
      return new Promise<IImageInfo[]>((resolve) => {
        if (!s2Instance.current) resolve([])
        const exporter = new Exporter(s2Instance.current!)
        exporter.export(cb=> {
          resolve(cb.toImageList())
        })
      })
    },
  }))

  return <div style={{ width: '100%', height: '100%' }} ref={domRef}></div>
}
import { FederatedMouseEvent } from "@antv/g";
import { IDataCellValue, IDataType, IDataTypeWithParent, IHeaderDataMap, IMatrixCanvasProps, IS2Options, MatrixField } from "./type";
import {  CellType, getCellMeta, Node, PivotSheet, S2CellType } from "@antv/s2";

import { ReactNode } from "react";
/** 折叠图标大小 */
export const CollapseIconSize = 12;
export const HeaderPadding = 8;
export const EmptyKey = '$$empty$$'
export const EmptyTextColor = '#cb3837'


function getColData(cols: IDataType[], collapseMap: Record<string, boolean>) {
    const newCols: IDataType[] = []
    const colData: IHeaderDataMap = {}

    const stacks = [...cols] as IDataTypeWithParent[]

    while (stacks.length) {
        const col = stacks.shift()!
        newCols.push(col)

        colData[col.key] = {
            parentKeys: col.$parents ?? '',
            title: col.title ?? '',
            childrenCount: col.children ? col.children.length : 0,
        }
        if (col.children) {
            if (!collapseMap[col.key]) {
                for (let i = 0; i < col.children.length; i++) {
                    col.children[i].$parents = col.$parents ? `${col.$parents}-${col.key}` : col.key
                    stacks.unshift(col.children[i])
                }
            } 
        }
    }
    return {
        newCols,
        colData
    }

}


export function getS2Data(cols: IDataType[], rows: IDataType[], options: IS2Options, parentDom: HTMLElement) {
    const data: IDataCellValue[] = []
    const { newCols, colData } = getColData(cols, options.colCollapseKeyMap!)
    const { newCols: newRows, colData: rowData } = getColData(rows, options.rowCollapseKeyMap!)
    console.log(newCols.length, newRows.length,'newRows.length')
    if (newCols.length === 0 && newRows.length === 0) {
        // 行列表头都不存在
        data.push({
            [MatrixField.ColunmField]: EmptyKey,
            [MatrixField.RowCountField]: EmptyKey,
            [MatrixField.RowField]: EmptyKey,
        })
    } else if (newCols.length === 0 && newRows.length > 0) {
        //行表头存在，列表头不存在
        newRows.forEach((row ,i)=> {
            data.push({
                [MatrixField.ColunmField]: EmptyKey,
                [MatrixField.RowCountField]: row.key,
                [MatrixField.RowField]: row.key,
            })
            rowData[row.key].title = i +rowData[row.key].title 
        })
    } else if (newCols.length > 0 && newRows.length === 0) {
        //列表头存在，行表头不存在
        newCols.forEach((col,i) => {
            data.push({
                [MatrixField.ColunmField]: col.key,
                [MatrixField.RowCountField]: EmptyKey,
                [MatrixField.RowField]: EmptyKey,
            })
            colData[col.key].title = i +colData[col.key].title 
        })
    } else {
      
        // 行列表头都存在 
        for (let i = 0; i < newCols.length; i++) {
            colData[newCols[i].key].title = i +colData[newCols[i].key].title
            for (let j = 0; j < newRows.length; j++) {
                data.push({
                    [MatrixField.ColunmField]: newCols[i].key,
                    [MatrixField.RowField]: newRows[j].key,
                    [MatrixField.RowCountField]: newRows[j].key
                })
                rowData[newRows[j].key].title = j +rowData[newRows[j].key].title
                
            }
        }
        console.log('Total Count',newCols.length*newRows.length)

    }

    options.width = getTableSize(parentDom.clientWidth, window.innerWidth, newCols.length, options.size!, options.showCount!, options.rowHeaderSize!)
    options.height = getTableSize(parentDom.clientHeight, window.innerHeight, newCols.length, options.size!, options.showCount!, options.rowHeaderSize!)
    if (newRows.length <= 0) {
        const wrapperSize = parentDom.clientHeight <= 0 ? window.innerHeight : parentDom.clientHeight;
        options.style!.dataCell!.height = wrapperSize - options.colHeaderSize! - (options.showCount ? options.size! : 0) - HeaderPadding
    }
    return {
        data,
        colData,
        rowData,
    }
}

export function getTableSize(_wrapperSize: number, defaultSize: number, count: number, cellSize: number, isShowCount: boolean, headerSize: number) {
    const wrapperSize = _wrapperSize <= 0 ? defaultSize : _wrapperSize;
    if (count <= 0) {
        return wrapperSize;
    } else {
        const calcWidth = headerSize + (count + (isShowCount ? 1 : 0)) * cellSize
        return calcWidth > wrapperSize ? wrapperSize : calcWidth
    }
}


export function getCellKey(type: CellType, id?: string): string {
    if (!id) return ''
    if (type === CellType.COL_CELL) {
        const isShowCount = id.includes(MatrixField.ValueField)
        const keyArr = id.split('[&]')
        return keyArr[keyArr.length - (isShowCount ? 2 : 1)]
    } else if (type === CellType.ROW_CELL) {
        const keyArr = id.split('[&]')
        return keyArr[keyArr.length - 1]
    } else if (CellType.DATA_CELL) {
        return id;
    }
    return ''
}

export function getCellKeys(meta: Node): [string, string] {
    // 返回行/列 key
    return [
        getCellKey(CellType.ROW_CELL, meta.rowId),
        getCellKey(CellType.COL_CELL, meta.colId)
    ]
}


export function showTooltip(s2: PivotSheet, event: FederatedMouseEvent, tooltip?: IMatrixCanvasProps['tooltip']) {
    const cell = s2.getCell(event.target) as S2CellType;
    if (!cell) {
        return;
    }
  
    const meta = getCellMeta(cell);
    let domNode: ReactNode | undefined
    if (meta.type === CellType.COL_CELL) {
        const isShowCount = meta.id.includes(MatrixField.ValueField)
        const colKey = getCellKey(meta.type, meta.id)
        if(colKey === EmptyKey) return
        domNode = tooltip?.(isShowCount ? 'Count' : meta.type, undefined, colKey)
    } else if (meta.type === CellType.ROW_CELL) {
        const keyArr = meta.id.split('[&]')
        const isShowCount = keyArr[keyArr.length - 1] === keyArr[keyArr.length - 2]
        const rowKey = getCellKey(meta.type, meta.id)
        if(rowKey === EmptyKey) return
        domNode = tooltip?.(isShowCount ? 'Count' : meta.type, getCellKey(meta.type, meta.id))
    } else if (meta.type === CellType.DATA_CELL) {
        const rowKey =  meta.rowQuery?.[MatrixField.RowField]
        const colKey =getCellKey(CellType.COL_CELL, meta.id)
        if(rowKey === EmptyKey || colKey === EmptyKey) return
        domNode = tooltip?.(meta.type,rowKey, colKey)
    }
    if (!domNode) return

    s2.showTooltip({
        position: {
            x: event.clientX,
            y: event.clientY,
        },
        content: domNode,
    });
}

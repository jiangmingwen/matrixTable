import { FederatedPointerEvent } from "@antv/g"
import { CellType, S2Options, SpreadSheet } from "@antv/s2"
import { ReactNode } from "react"


export enum MatrixField {
    RowCountField = "_Matrix_Row_Count_Field",
    ColunmField = "_Matrix_Colunm_Field",
    RowField = "_Matrix_Row_Field",
    ValueField = "_Matrix_Value_Field",
    ColCountField = "$$extra$$"
}

export interface IDataType {
    /** 唯一标识 */
    key: string
    title?: string
    /** 树形表头 */
    children?: IDataType[]
}

export interface IDataTypeWithParent extends IDataType {
    /** 树形表头 */
    children?: IDataTypeWithParent[]
    $parents?: string
}


export interface IDataCellValue {
    [MatrixField.ColunmField]: string
    [MatrixField.RowField]: string
    [MatrixField.RowCountField]: string
    children?: IDataCellValue[]
}

export type IHeaderData = {
    parentKeys: string
    title: string
    childrenCount: number
    isCollapsed?: boolean
}


export type IHeaderDataMap = Record<string, IHeaderData>


export interface ICheckboxCell {
    type: 'checkbox'
    value: boolean
    disabled?: boolean
}

export interface ITextCell {
    type: 'text'
    value: string
    disabled?: boolean

}

export interface IImageCell {
    type: 'image'
    value: string | string[]
    disabled?: boolean
}

export interface IEmptyCell {
    type: 'empty'
    disabled?: boolean

}

export interface ICornerCell {
    type: 'corner'
    text: [string, string]
}

export interface ICorCellContent {
    icon: string
    text: string
}

export interface ICornerCellIconText {
    type: 'iconText'
    text: ICorCellContent[] | string[]
    // 图标和文字的间距
    gap?: number
    /** 行高 */
    lineHeight?: number
    /** 行数量 */
    rowCount?: number
    /** 列数量 */
    colCount?: number
}


export interface ICustomCornerCell {
    type: 'icon' | 'text'
    data: string
    x: number
    y: number
    size: number
}


export type ICustomCornerFn = (width: number, height: number) => ICustomCornerCell[]

export interface ICornerCellCustom {
    type: 'custom'
    /** 渲染函数 */
    renderFn: ICustomCornerFn
}




/** 角区域渲染 */
export type ICornerValueCell = ICornerCell | ICornerCellIconText | ICornerCellCustom

/** 单元格渲染 */
export type IValueCell = ICheckboxCell | ITextCell | IImageCell | IEmptyCell

/** 自定义渲染单元格 */
export type IRenderCell = (rowKey: string, colKey: string) => IValueCell


export interface IMatrixCanvasProps extends ICustomOptions {
    /** 列表头 */
    colHeaders: IDataType[]

    /** 行表头 */
    rowHeaders: IDataType[]


    /** 自定义悬浮提示 */
    tooltip?: (cellType: CellType | 'Count', rowKey?: string, colKey?: string) => ReactNode

    /** 列选中回调 */
    onColSelect?: (keys: string[]) => void
    /** 行选中回调 */
    onRowSelect?: (keys: string[]) => void
    /** 数据选中回调 */
    onDataSelect?: (keys: { rowKey: string, colKey: string }[]) => void

    ref?: React.ForwardedRef<IMatrixCanvasInstance>
}

export interface IMatrixCanvasInstance {
    export: () => Promise<IImageInfo[]>
}

export interface ICustomOptions {
    /** 是否显示小计（数量） */
    showCount?: boolean

    /** 单元格大小 
   * @default 40
  */
    size?: number
    /**
     * 列表头高度
     * @default 120
     */
    colHeaderSize?: number
    /**
     * 行列表头宽度
     * @default 120
     */
    rowHeaderSize?: number

    /** 自定义渲染单元格 */
    renderCell?: (rowKey: string, colKey: string) => IValueCell
    /** 渲染表头的图标 */
    renderHeaderIcon?: (key: string, colKey?: string, rowKey?: string) => string
    /** 是否显示层级连线 */
    showLine?: boolean

    /** 单元格右键 */
    onContextMenu?: (type: 'row' | 'col' | 'data' | 'rowCount' | 'colCount', x: number, y: number, rowKey?: string, colKey?: string) => void

    /** checkBox 回调 */
    onCheck?: (rowKey: string, colKey: string, checked: boolean, update: () => void) => void

    /** 表头图标大小
     * @default 12
    */
    headerIconSize?: number
    /** 单元格图标大小
     * @default 12
    */
    cellIconSize?: number
    /** 渲染表头数量 */
    renderCount?: (key: string, colKey?: string, rowKey?: string) => number
    /** 渲染左上角表头 */
    renderCornerCell?: () => ICornerValueCell
    /** 行表头为空的数据文本 
     * @default '行表头为空'
    */
    emptyRowHeaderText?: string
    /** 列表头为空的数据文本
     * @default '列表头为空'
     */
    emptyColHeaderText?: string
    /** 单元格空数据文本
     * 不配置则为 shape  x 填充
     */
    emptyDataText?: string
    /** checkbox选中颜色 */
    checkboxActiveColor?: string
}

export interface IS2Options extends S2Options, ICustomOptions {
    rowCollapseKeyMap?: Record<string, boolean>
    colCollapseKeyMap?: Record<string, boolean>
}

export interface ICellMount {
    /** 折叠回调 */
    onCollpase: (e: FederatedPointerEvent, spreadsheet: SpreadSheet) => void
    /** 是否折叠状态 */
    isCollapse?: boolean
    /**  */
    headerData: IHeaderData
}

export interface IImageInfo {
    data: string
    x: number
    y: number
    width: number
    height: number
}
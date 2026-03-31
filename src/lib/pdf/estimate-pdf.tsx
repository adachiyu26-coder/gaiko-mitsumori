import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register Noto Sans JP font
Font.register({
  family: "NotoSansJP",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.1/files/noto-sans-jp-japanese-400-normal.woff",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.1/files/noto-sans-jp-japanese-700-normal.woff",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 9,
    padding: 40,
    paddingBottom: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
  },
  companyInfo: {
    textAlign: "right",
    fontSize: 8,
  },
  companyName: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 4,
  },
  customerSection: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
  },
  customerName: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 4,
  },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#1e3a5f",
    borderRadius: 4,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 12,
    color: "#fff",
    fontWeight: 700,
  },
  totalAmount: {
    fontSize: 20,
    color: "#fff",
    fontWeight: 700,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    fontWeight: 700,
    fontSize: 7,
  },
  tableRow: {
    flexDirection: "row",
    padding: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    fontSize: 8,
  },
  levelRow: {
    flexDirection: "row",
    padding: 4,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    fontWeight: 700,
    fontSize: 8,
  },
  colName: { flex: 3 },
  colSpec: { flex: 2 },
  colQty: { width: 40, textAlign: "right" },
  colUnit: { width: 30 },
  colPrice: { width: 60, textAlign: "right" },
  colAmount: { width: 60, textAlign: "right" },
  colCost: { width: 60, textAlign: "right", color: "#999" },
  summarySection: {
    marginTop: 16,
    alignSelf: "flex-end",
    width: 250,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    fontSize: 9,
  },
  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: "#333",
    fontWeight: 700,
    fontSize: 11,
  },
  noteSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fafafa",
    borderRadius: 4,
    fontSize: 8,
  },
  noteTitle: {
    fontWeight: 700,
    marginBottom: 4,
    fontSize: 9,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#999",
  },
  internalWatermark: {
    position: "absolute",
    top: 20,
    right: 40,
    fontSize: 12,
    color: "red",
    fontWeight: 700,
  },
});

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ja-JP");
}

interface EstimatePdfProps {
  estimate: {
    estimateNumber: string;
    version: number;
    title: string;
    estimateDate: Date;
    expiryDate: Date | null;
    siteAddress: string | null;
    subtotal: number;
    expenseRate: number;
    expenseAmount: number;
    discountAmount: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
    costSubtotal: number;
    grossProfit: number;
    grossProfitRate: number;
    note: string | null;
    paymentTerms: string | null;
    items: {
      id: string;
      parentItemId: string | null;
      level: number;
      sortOrder: number;
      itemName: string;
      specification: string | null;
      quantity: number | null;
      unit: string | null;
      unitPrice: number | null;
      costPrice: number | null;
      amount: number;
      costAmount: number;
      isAlternative: boolean;
    }[];
  };
  company: {
    name: string;
    address: string | null;
    phone: string | null;
    fax: string | null;
    email: string | null;
    registrationNumber: string | null;
    logoUrl: string | null;
  };
  customer: {
    name: string;
    honorific: string;
    address: string | null;
  } | null;
  showCost: boolean;
}

export function EstimatePdf({
  estimate,
  company,
  customer,
  showCost,
}: EstimatePdfProps) {
  const rootItems = estimate.items.filter((i) => i.parentItemId === null);
  const getChildren = (parentId: string) =>
    estimate.items
      .filter((i) => i.parentItemId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

  const renderItems = (parentId: string | null, level: number): React.ReactNode[] => {
    const children = parentId
      ? getChildren(parentId)
      : rootItems;

    return children.flatMap((item) => {
      const indent = (item.level - 1) * 12;
      const isDetail = item.level === 4;

      const rows: React.ReactNode[] = [];

      if (!isDetail) {
        rows.push(
          <View key={item.id} style={styles.levelRow}>
            <Text style={[styles.colName, { paddingLeft: indent }]}>
              {item.itemName}
            </Text>
            <Text style={{ flex: 1, textAlign: "right", fontSize: 8 }}>
              小計 {formatCurrency(
                estimate.items
                  .filter((c) => {
                    if (c.parentItemId === item.id && c.level === 4 && !c.isAlternative) return true;
                    const parent = estimate.items.find((p) => p.id === c.parentItemId);
                    if (parent && parent.parentItemId === item.id && c.level === 4 && !c.isAlternative) return true;
                    return false;
                  })
                  .reduce((sum, c) => sum + c.amount, 0)
              )}
            </Text>
          </View>
        );
      } else {
        rows.push(
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.colName, { paddingLeft: indent }]}>
              {item.itemName}
            </Text>
            <Text style={styles.colSpec}>{item.specification ?? ""}</Text>
            <Text style={styles.colQty}>
              {item.quantity != null ? item.quantity.toString() : ""}
            </Text>
            <Text style={styles.colUnit}>{item.unit ?? ""}</Text>
            <Text style={styles.colPrice}>
              {item.unitPrice != null ? formatCurrency(item.unitPrice) : ""}
            </Text>
            <Text style={styles.colAmount}>{formatCurrency(item.amount)}</Text>
            {showCost && (
              <Text style={styles.colCost}>
                {item.costPrice != null ? formatCurrency(item.costPrice) : ""}
              </Text>
            )}
          </View>
        );
      }

      if (!isDetail) {
        rows.push(...renderItems(item.id, item.level + 1));
      }

      return rows;
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {showCost && (
          <Text style={styles.internalWatermark}>社内用</Text>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>御 見 積 書</Text>
            <Text style={styles.subtitle}>
              No. {estimate.estimateNumber} (v{estimate.version})
            </Text>
            <Text style={styles.subtitle}>
              見積日: {formatDate(estimate.estimateDate)}
              {estimate.expiryDate &&
                ` ・ 有効期限: ${formatDate(estimate.expiryDate)}`}
            </Text>
          </View>
          <View style={styles.companyInfo}>
            {company.logoUrl && (
              <Image
                src={company.logoUrl}
                style={{ width: 100, height: 40, marginBottom: 4, objectFit: "contain" as const, alignSelf: "flex-end" as const }}
              />
            )}
            <Text style={styles.companyName}>{company.name}</Text>
            {company.address && <Text>{company.address}</Text>}
            {company.phone && <Text>TEL: {company.phone}</Text>}
            {company.fax && <Text>FAX: {company.fax}</Text>}
            {company.registrationNumber && (
              <Text>登録番号: {company.registrationNumber}</Text>
            )}
          </View>
        </View>

        {/* Customer */}
        {customer && (
          <View style={styles.customerSection}>
            <Text style={styles.customerName}>
              {customer.name}
              {customer.honorific}
            </Text>
            {customer.address && <Text>{customer.address}</Text>}
            {estimate.siteAddress && (
              <Text>現場: {estimate.siteAddress}</Text>
            )}
          </View>
        )}

        {/* Title & Total */}
        <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
          件名: {estimate.title}
        </Text>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>合計金額（税込）</Text>
          <Text style={styles.totalAmount}>
            {formatCurrency(estimate.totalAmount)}
          </Text>
        </View>

        {/* Items table */}
        <View style={styles.tableHeader}>
          <Text style={styles.colName}>品名</Text>
          <Text style={styles.colSpec}>規格</Text>
          <Text style={styles.colQty}>数量</Text>
          <Text style={styles.colUnit}>単位</Text>
          <Text style={styles.colPrice}>単価</Text>
          <Text style={styles.colAmount}>金額</Text>
          {showCost && <Text style={styles.colCost}>原価</Text>}
        </View>
        {renderItems(null, 1)}

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text>小計</Text>
            <Text>{formatCurrency(estimate.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>諸経費（{estimate.expenseRate}%）</Text>
            <Text>{formatCurrency(estimate.expenseAmount)}</Text>
          </View>
          {estimate.discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text>値引き</Text>
              <Text>-{formatCurrency(estimate.discountAmount)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text>消費税（{estimate.taxRate}%）</Text>
            <Text>{formatCurrency(estimate.taxAmount)}</Text>
          </View>
          <View style={styles.summaryTotal}>
            <Text>合計</Text>
            <Text>{formatCurrency(estimate.totalAmount)}</Text>
          </View>
          {showCost && (
            <>
              <View style={[styles.summaryRow, { marginTop: 8 }]}>
                <Text style={{ color: "#999" }}>原価合計</Text>
                <Text style={{ color: "#999" }}>
                  {formatCurrency(estimate.costSubtotal)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={{ color: "#999" }}>
                  粗利（{estimate.grossProfitRate}%）
                </Text>
                <Text style={{ color: "#999" }}>
                  {formatCurrency(estimate.grossProfit)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Notes */}
        {(estimate.note || estimate.paymentTerms) && (
          <View style={styles.noteSection}>
            {estimate.note && (
              <View>
                <Text style={styles.noteTitle}>備考</Text>
                <Text>{estimate.note}</Text>
              </View>
            )}
            {estimate.paymentTerms && (
              <View style={{ marginTop: 6 }}>
                <Text style={styles.noteTitle}>支払条件</Text>
                <Text>{estimate.paymentTerms}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{company.name}</Text>
          <Text>
            {estimate.estimateNumber} - {formatDate(estimate.estimateDate)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

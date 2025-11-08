import React, { useRef, useEffect } from 'react';
import { ScrollView, View, Dimensions } from 'react-native';

// Usage: <ResponsiveTable exportingWide={true}><View>...</View></ResponsiveTable>
export default function ResponsiveTable({ children, minWidth, onTableWidth, exportingWide }) {
  const tableRef = useRef(null);
  // Get device width
  const deviceWidth = Dimensions.get('window').width;
  // When exportingWide, set table width to device width (but not less than A4)
  const wrapperStyle = exportingWide
    ? { width: Math.max(deviceWidth, 1122), minWidth: 1122, alignSelf: 'center' }
    : (minWidth ? { minWidth } : { minWidth: '100%' });

  useEffect(() => {
    if (tableRef.current && onTableWidth) {
      tableRef.current.measure((x, y, width, height, pageX, pageY) => {
        onTableWidth(width);
      });
    }
  }, [onTableWidth]);

  return (
    <ScrollView
      horizontal={!exportingWide}
      showsHorizontalScrollIndicator={!exportingWide}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View ref={tableRef} style={wrapperStyle}>
        {children}
      </View>
    </ScrollView>
  );
}

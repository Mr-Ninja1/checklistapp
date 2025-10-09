import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import ResponsiveView from './ResponsiveView';

const renderValue = (val, keyPrefix = '') => {
    if (val === null || val === undefined) return <Text style={styles.valueText}>-</Text>;
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return <Text style={styles.valueText}>{String(val)}</Text>;
    if (Array.isArray(val)) {
        return (
            <View style={{ paddingLeft: 8 }}>
                {val.map((v, i) => (
                    <View key={i} style={{ marginBottom: 6 }}>
                        <Text style={styles.subHeading}>- Item {i + 1}</Text>
                        {renderValue(v, `${keyPrefix}[${i}]`)}
                    </View>
                ))}
            </View>
        );
    }
    if (typeof val === 'object') {
        return (
            <View style={{ paddingLeft: 8 }}>
                {Object.entries(val).map(([k, v]) => (
                    <View key={k} style={{ marginBottom: 6 }}>
                        <Text style={styles.subHeading}>{k}</Text>
                        {renderValue(v, keyPrefix ? `${keyPrefix}.${k}` : k)}
                    </View>
                ))}
            </View>
        );
    }
    return <Text style={styles.valueText}>{String(val)}</Text>;

};

const GenericReadOnlyForm = ({ form, children, title, area, docNo, issueDate }) => {
    if (!form) return null;

    const metadata = form.meta || form.metadata || {};
    const verification = (form.meta && form.meta.verification) || form.verification || (form.meta && form.meta.meta && form.meta.meta.verification) || null;

    return (
        <ResponsiveView>
            <ScrollView style={styles.container}>
                <View style={styles.card}>
                    <View style={styles.headerTop}>
                        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
                        <View style={{ flex: 1, paddingLeft: 12 }}>
                            <Text style={styles.companyName}>Bravo</Text>
                            {area && <Text style={styles.areaTitle}>{area}</Text>}
                        </View>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            {title && <Text style={styles.mainTitle}>{title}</Text>}
                        </View>
                    </View>

                    {metadata && Object.keys(metadata).length > 0 && (
                        <View style={styles.metadataContainer}>
                            {Object.entries(metadata).map(([key, value]) => (
                                <View key={key} style={{ marginBottom: 6 }}>
                                    <Text style={styles.metaKey}>{`${key.charAt(0).toUpperCase() + key.slice(1)}:`}</Text>
                                    {renderValue(value, key)}
                                </View>
                            ))}
                        </View>
                    )}

                    {children}

                    {/* For arbitrary saved forms, render a pretty view of the meta if present */}
                    {form && form.meta && (
                        <View style={{ marginTop: 12 }}>
                            <Text style={styles.subHeading}>Form Data</Text>
                            {renderValue(form.meta)}
                        </View>
                    )}

                    {verification && (
                        <View style={styles.verificationContainer}>
                            <Text style={styles.verificationTitle}>Verification</Text>
                            {Object.entries(verification).map(([key, value]) => (
                                <Text key={key}>{`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`}</Text>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </ResponsiveView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 8
    },
    logo: {
        width: 72,
        height: 72,
        borderRadius: 8
    },
    companyName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#185a9d'
    },
    areaTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#374151',
        textAlign: 'left'
    },
    mainTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
        textAlign: 'center',
        marginTop: 8
    },
    metadataContainer: {
        padding: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        marginBottom: 20
    },
    verificationContainer: {
        marginTop: 32,
        padding: 16,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        backgroundColor: '#F9FAFB'
    },
    verificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 8,
        marginBottom: 12
    },
    valueText: {
        color: '#374151',
        fontSize: 14,
    },
    subHeading: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    metaKey: {
        fontWeight: '700',
        color: '#374151',
        marginBottom: 4,
    },
});

export default GenericReadOnlyForm;
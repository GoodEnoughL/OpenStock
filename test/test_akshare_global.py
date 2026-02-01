#!/usr/bin/env python3
"""
深入测试AKShare对港美股的实际支持情况
"""

import requests
import json

def test_akshare_global_support():
    base_url = "http://localhost:8080"
    
    print("🌍 深入测试AKShare对全球市场的实际支持...")
    
    # 测试港股实时数据
    print("\n📈 测试港股实时数据接口:")
    hk_interfaces = [
        "stock_hk_spot_em",      # 东方财富港股实时数据
        "stock_hk_spot",         # 新浪港股实时数据
        "stock_hk_hist",         # 港股历史数据
        "stock_hk_spot_sina",    # 新浪港股实时数据
    ]
    
    for interface in hk_interfaces:
        try:
            # 先测试接口是否存在
            response = requests.get(f"{base_url}/api/public/{interface}")
            print(f"   {interface}: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    print(f"     数据条数: {len(data)}")
                    if len(data) > 0:
                        print(f"     第一条数据: {data[0]}")
                else:
                    print(f"     数据格式: {type(data)}")
                    if isinstance(data, dict):
                        print(f"     数据内容: {data}")
        except Exception as e:
            print(f"   {interface}: 错误 - {e}")
    
    # 测试具体港股代码
    print("\n🔍 测试具体港股代码:")
    hk_symbols = ["00700", "00941", "01299"]
    for symbol in hk_symbols:
        try:
            # 测试港股个股信息
            response = requests.get(f"{base_url}/api/public/stock_hk_spot_em?symbol={symbol}")
            print(f"   港股 {symbol}: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"     数据: {data}")
        except Exception as e:
            print(f"   港股 {symbol}: 错误 - {e}")
    
    # 测试美股实时数据
    print("\n🇺🇸 测试美股实时数据接口:")
    us_interfaces = [
        "stock_us_spot_em",      # 东方财富美股实时数据
        "stock_us_spot",         # 新浪美股实时数据
        "stock_us_hist",         # 美股历史数据
        "stock_us_spot_sina",    # 新浪美股实时数据
    ]
    
    for interface in us_interfaces:
        try:
            response = requests.get(f"{base_url}/api/public/{interface}")
            print(f"   {interface}: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    print(f"     数据条数: {len(data)}")
                    if len(data) > 0:
                        print(f"     第一条数据: {data[0]}")
                else:
                    print(f"     数据格式: {type(data)}")
        except Exception as e:
            print(f"   {interface}: 错误 - {e}")
    
    # 测试具体美股代码
    print("\n🔍 测试具体美股代码:")
    us_symbols = ["AAPL", "MSFT", "GOOGL", "NVDA"]
    for symbol in us_symbols:
        try:
            # 测试美股个股信息
            response = requests.get(f"{base_url}/api/public/stock_us_spot_em?symbol={symbol}")
            print(f"   美股 {symbol}: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"     数据: {data}")
        except Exception as e:
            print(f"   美股 {symbol}: 错误 - {e}")
    
    # 测试AKShare的通用搜索接口
    print("\n🔎 测试AKShare搜索功能:")
    search_queries = ["腾讯", "00700", "AAPL", "NVDA"]
    for query in search_queries:
        try:
            # 测试股票搜索
            response = requests.get(f"{base_url}/api/public/stock_info_a_code_name")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # 在A股数据中搜索
                    results = [item for item in data if isinstance(item, dict) and 
                             (query in str(item.get('code', '')) or 
                              query in str(item.get('name', '')) or
                              query in str(item.get('代码', '')) or
                              query in str(item.get('名称', '')))]
                    print(f"   搜索 '{query}': 在A股中找到 {len(results)} 条结果")
                else:
                    print(f"   搜索 '{query}': 数据格式不是列表")
        except Exception as e:
            print(f"   搜索 '{query}': 错误 - {e}")

if __name__ == "__main__":
    test_akshare_global_support()
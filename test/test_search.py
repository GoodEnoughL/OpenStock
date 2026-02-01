#!/usr/bin/env python3
"""
测试Aktools搜索功能
"""

import requests
import json

def test_search_api():
    base_url = "http://localhost:8080"
    
    print("🔍 测试Aktools搜索API...")
    
    # 测试股票信息接口
    try:
        response = requests.get(f"{base_url}/api/public/stock_info_a_code_name")
        print(f"✅ 股票信息接口状态: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   数据类型: {type(data)}")
            if isinstance(data, list):
                print(f"   数据条数: {len(data)}")
                if len(data) > 0:
                    print("   前3条数据:")
                    for i, item in enumerate(data[:3]):
                        print(f"     {i+1}. {item}")
            else:
                print(f"   数据内容: {data}")
        else:
            print(f"   错误信息: {response.text}")
    except Exception as e:
        print(f"❌ 股票信息接口测试失败: {e}")
    
    # 测试搜索功能
    test_queries = ["平安", "腾讯", "AAPL"]
    
    for query in test_queries:
        try:
            # 模拟搜索逻辑
            response = requests.get(f"{base_url}/api/public/stock_info_a_code_name")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # 在数据中搜索
                    results = []
                    for item in data:
                        if isinstance(item, dict):
                            code = item.get('代码', '')
                            name = item.get('名称', '')
                            if query in code or query in name:
                                results.append(item)
                    
                    print(f"✅ 搜索 '{query}': 找到 {len(results)} 条结果")
                    if results:
                        for i, result in enumerate(results[:2]):
                            print(f"     {i+1}. 代码: {result.get('代码', 'N/A')}, 名称: {result.get('名称', 'N/A')}")
                else:
                    print(f"⚠️  搜索 '{query}': 数据格式不是列表")
        except Exception as e:
            print(f"❌ 搜索 '{query}' 失败: {e}")

if __name__ == "__main__":
    test_search_api()
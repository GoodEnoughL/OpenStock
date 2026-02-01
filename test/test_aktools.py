#!/usr/bin/env python3
"""
Aktools API 测试脚本
"""

import requests
import json

def test_aktools_api():
    base_url = "http://localhost:8080"
    
    print("🧪 测试 Aktools API 连接...")
    
    # 测试根路径
    try:
        response = requests.get(base_url)
        print(f"✅ 根路径状态: {response.status_code}")
        if response.text:
            print(f"   响应内容: {response.text[:100]}...")
    except Exception as e:
        print(f"❌ 根路径连接失败: {e}")
    
    # 测试API文档
    try:
        response = requests.get(f"{base_url}/docs")
        print(f"✅ API文档状态: {response.status_code}")
    except Exception as e:
        print(f"❌ API文档连接失败: {e}")
    
    # 测试OpenAPI文档
    try:
        response = requests.get(f"{base_url}/openapi.json")
        print(f"✅ OpenAPI状态: {response.status_code}")
    except Exception as e:
        print(f"❌ OpenAPI连接失败: {e}")
    
    # 测试股票数据端点
    endpoints = [
        "/stock_zh_a_spot_em",
        "/stock_info_a_code_name",
        "/stock_zh_index_spot"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}")
            print(f"✅ {endpoint} 状态: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"   数据条数: {len(data)}")
                elif isinstance(data, dict):
                    print(f"   数据类型: 字典")
        except Exception as e:
            print(f"❌ {endpoint} 连接失败: {e}")

if __name__ == "__main__":
    test_aktools_api()
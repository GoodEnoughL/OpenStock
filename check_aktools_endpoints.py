#!/usr/bin/env python3
"""
检查Aktools API端点
"""

import requests
import json

def check_aktools_endpoints():
    base_url = "http://localhost:8080"
    
    print("🔍 检查Aktools API端点...")
    
    # 获取OpenAPI文档
    try:
        response = requests.get(f"{base_url}/openapi.json")
        api_spec = response.json()
        
        print("✅ OpenAPI文档获取成功")
        print(f"   版本: {api_spec.get('openapi', 'N/A')}")
        print(f"   标题: {api_spec.get('info', {}).get('title', 'N/A')}")
        
        # 列出所有端点
        print("\n📋 可用端点:")
        paths = api_spec.get('paths', {})
        for path in sorted(paths.keys()):
            print(f"   {path}")
            
    except Exception as e:
        print(f"❌ 获取OpenAPI文档失败: {e}")

if __name__ == "__main__":
    check_aktools_endpoints()